import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
import OpenAI from "openai";
import type { Request, Response } from "express";
import { io, userPrompts } from "../server.js";
import { allUserMessages, getLastMessages, storeMessages, storeSummarizeMessages } from "../db/model.js";

const imageGeneration = async (req: Request, res: Response) => {
    const { socketId } = req.body;

    if (!socketId) return res.status(400).json({ error: "socketId required" })

    const prompt = userPrompts[socketId];
    if (!prompt)
        return res.status(400).json({ error: "No prompt found for this socket" })

    console.log("starting stream for:", socketId, "Prompt:", prompt)

    // TOOL
    const generateImage = {
        name: "generate_image_tool",
        description: "Generate an image from user prompt",
        schema: z.object({
            text: z.string(),
        }),
        async func({ text }: { text: string }) {
            const client = new OpenAI({ apiKey: process.env.API_KEY });

            const img = await client.images.generate({
                model: "dall-e-3",
                prompt: text,
                size: "1024x1024",
                n: 1,
            });

            // img object
            console.log(img)
            if (img.data && img.data[0] && img.data[0].url) {
                const imageUrl = img.data[0].url
                console.log("image URl:", imageUrl)
                //hasImageUrl = imageUrl
                return imageUrl
            }
            else {
                throw new Error("Image Generation Failed")
            }


        },
    };

    //  MODEL 
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.API_KEY,
    })

    // OLD MESSAGES
    const oldMessages = await getLastMessages({ userId: socketId }) || []
    console.log("old messages:", oldMessages)

    // All MESSAGES (string)
    const allMessages = await allUserMessages({ userId: socketId })
    console.log("all messages:", allMessages)

    // summarizer model
    const summarizer = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: process.env.API_KEY,
    })

    // invoke 
    const summaryResult = await summarizer.invoke([
        {
            role: "system",
            content:
                "Summarize ONLY the user's messages. Extract stable user info(name,address,hobbies,job), ongoing projects, preferences.Until their is nothing to extract return ''. Max 800 chars.",
        },
        {
            role: "user",
            content: allMessages as string,
        },
    ])

    const summaryText = summaryResult.content || ""
    console.log("summaryText direct-->",summaryResult)
    console.log("summaryText:", summaryText)


    //save the summary to db
    await storeSummarizeMessages({userId:socketId,summarizeText:summaryText as string})

    const systemPrompt = `
           You are an AI chatbot designed to behave like the user's caring best friend.

You have two sources of context:
1. recentMessages → the last 10 messages from the current conversation  
2. longTermSummary → a compressed summary of all past user info extracted from earlier conversations

Use longTermSummary ONLY to:
- recall stable user preferences (skills, goals, projects, personality, writing style)
- maintain long-term continuity naturally
- avoid repeating things the user already told you earlier

Use recentMessages ONLY to:
- continue the current topic
- understand the emotional flow
- maintain short-term context

STRICT RULES:
- Never reveal, quote, or mention “longTermSummary”, “recentMessages”, “history”, “database”, “memory”, or how you know things.
- Never say “based on previous chats” or “as you said earlier”.
- Just respond naturally as if you casually remember things like a friend.

============================================
### PERSONALITY & TONE
Warm, supportive, fun, best-friend energy.
Use light reactions: “broo”, “wait what 😂”, “ohhh”, etc.
Empathize first, then respond.
Be honest but kind.
Keep the flow natural and conversational.

============================================
### SAFETY RULES
- No medical, legal, or financial advice.
- Do not act as a therapist.
- No dangerous instructions.

============================================
### CONTEXT PROVIDED TO YOU:
longTermSummary: """${summaryText}"""

recentMessages: (already provided before this)
newUserMessage: """${prompt}"""

Respond as a supportive best friend using all context naturally.

`
    //  AGENT 
    const agent = createAgent({
        model,
        // tools: 
        // [generateImage]
        // ,
        systemPrompt: systemPrompt
    })




    //  user message
    await storeMessages({ userId: socketId, role: 'user', content: prompt })




    // SIGNAL start
    res.json({ status: "streaming_started" })

    // STREAMING
    const stream = await agent.stream(
        {
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                ...oldMessages.map(m => ({
                    role: m.role === "ai" ? "assistant" : "user",
                    content: m.content,
                })),
                {
                    role: "user",
                    content: prompt
                }
            ]
        },
        { streamMode: "messages" }
    );


    let aiMessage = ""
    for await (const [chunk] of stream) {
        const token = chunk?.contentBlocks?.[0]?.text;
        if (!token) continue;
        aiMessage += token
        io.to(socketId).emit("send_chunks", token);
    }
    await storeMessages({ userId: socketId, role: 'ai', content: aiMessage })



};

export default imageGeneration;

