import { createAgent } from "langchain";
import { initChatModel } from "langchain";
import * as z from "zod";
import OpenAI from "openai";
import type { Request, Response } from "express";
import { io, isRegenereate, sessionID, userID, userPrompt } from "../server.js";
import { getExtractedFacts, getLastMessages, getMessageCount, getSession, getSummarizeMessages, storeExtractedFacts, storeMessages, storeSessionId, storeSummarizeMessages, storeUser } from "../db/model.js";
import crypto from "crypto";


// models
const chatModel = await initChatModel(
    "google-genai:gemini-2.5-flash"
)

const lightModel = await initChatModel(
    "google-genai:gemini-2.5-flash-lite"
)

const chatController = async (req: Request, res: Response) => {
    const { socketId } = req.body;
    if (!socketId) return res.status(400).json({ error: "socketId required" })

    const prompt = userPrompt
    if (!prompt)
        return res.status(400).json({ error: "No prompt found for this socket" })

    console.log("starting stream for:", socketId, "Prompt:", prompt)

    if (userID) {
        await storeUser({ userId: userID })
    }

    // Last 10 Messages
    const lastTenMessages = await getLastMessages({ sessionId: sessionID }) || []

    // Facts
    let facts = await getExtractedFacts(userID)

    // Summary Text
    let summaryText = await getSummarizeMessages({
        userId: userID
    }) || ""

    // invoke title agent
    const session = await getSession(sessionID)

    if ((!session || !session.title)) {
        const titleResult = await lightModel.invoke([
            {
                role: "system",
                content: `Generate a short and concise chat title in 4-6 words based on the users message. Do NOT answer the question, just summarize it as a title. 
                        Example:
                        User message: Hello, what is the capital of America? 
                        Title: Capital of America 
                        User message: How do I reset my password on Gmail? 
                        Title: Gmail Password Reset`
            },
            {
                role: "user",
                content: prompt
            }
        ])
        const titleText = titleResult.content || ""

        await storeSessionId({ sessionId: sessionID, userId: userID, title: titleText as string })
        io.to(socketId).emit("send_sessionId_with_title", sessionID, titleText)
    }

    //  store user message
    let conversationId = ""
    if (!isRegenereate) {
        conversationId = crypto.randomUUID()
        await storeMessages({ userId: userID, sessionId: sessionID, role: 'user', content: prompt, messageId: conversationId })
    }

    // system Prompt 
    const systemPrompt = `
        You are an AI chatbot designed to behave like the user's caring best friend.
        You have your own friendly nickname: Nova.

        If someone asks your name,
        always answer "I'm Nova."

        You have three sources of context:

        1. recentMessages → the last 10 messages from the current conversation
        2. longTermSummary → a compressed summary of all past user info extracted from earlier conversations
        3. userFacts → stable facts extracted from previous conversations (name, skills, goals, projects, preferences)

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
        User Facts: """${facts}"""

        Respond as a supportive best friend using all context naturally.

        `

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
            if (img.data && img.data[0] && img.data[0].url) {
                const imageUrl = img.data[0].url
                //hasImageUrl = imageUrl
                return imageUrl
            }
            else {
                throw new Error("Image Generation Failed")
            }


        },
    }

    //  AGENT 
    const agent = createAgent({
        model: chatModel,
        systemPrompt: systemPrompt
    })


    // SIGNAL start
    res.json({ status: "streaming_started" })

    // STREAMING
    const stream = await agent.stream(
        {
            messages: [
                ...lastTenMessages.map(m => ({
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
    )

    const responseId = crypto.randomUUID()


    let aiMessage = ""
    for await (const [chunk] of stream) {
        const token = chunk?.contentBlocks?.[0]?.text;
        if (!token) continue;
        aiMessage += token
        io.to(socketId).emit("send_chunks", token);
    }

    await storeMessages({ userId: userID, sessionId: sessionID, role: 'assistant', content: aiMessage, messageId: responseId })
    io.to(socketId).emit(
        "update_sidebar_last_message",
        sessionID,
        aiMessage
    )
    io.to(socketId).emit("send_messageId", responseId, conversationId)


    const latestMessages = await getLastMessages({
        sessionId: sessionID,
    }) || []

    // invoke extractor agent     
    const extractorResult = await lightModel.invoke([
        {
            role: "system",
            content: `
            You are a memory extraction system for an AI assistant.

            Your job is NOT to summarize the conversation.
            Your job is to extract ONLY information that will remain useful in future conversations.

            Analyze ONLY user messages.

            Extract:

            1. Personal information:
            - name
            - location (only if explicitly provided)
            - occupation/student status
            - important life details

            2. Long-term interests:
            - hobbies
            - skills
            - what are they learning
            - favorite topics

            3. Goals:
            - career goals
            - learning goals
            - ongoing projects
            - future plans

            4. Preferences:
            - communication style
            - coding preferences
            - writing preferences
            - recurring choices

            5. Important context:
            - recurring problems
            - decisions already made
            - things the assistant should remember

            Rules:
            - Do NOT store temporary emotions or one-time requests.
            - Do NOT store greetings or casual conversation.
            - Do NOT store questions unless they reveal a preference or goal.
            - Remove duplicate information.
            - Keep only stable facts.
            - If there is nothing worth remembering, return exactly:
            ""

            Output format:

            Name:
            -

            Background:
            -

            Skills:
            -

            Projects:
            -

            Goals:
            -

            Preferences:
            -

            Important notes:
            -`,
        },
        {
            role: "user",
            content:
                `Existing memory:
                ${facts}

                New conversation messages:
                ${latestMessages.filter(m => m.role === "user").map(m => `user: ${m.content}`).join("\n")}

                Update the memory.
                Keep previous useful information.
                Remove outdated information`
        },
    ])
    const extractedFact = extractorResult.content as string
    await storeExtractedFacts({
        userId: userID,
        extractedFacts: extractedFact
    })

    // invoke summary agent     
    const messageCount = await getMessageCount({
        userId: userID,
        sessionId: sessionID
    })


    if (messageCount % 20 == 0) {
        const summaryResult = await lightModel.invoke([
            {
                role: "system",
                content: `You are a conversation summarization system.

                Your task is to maintain a rolling summary of the conversation.

                You will receive:
                1. The previous summary.
                2. The latest conversation messages.

                Update the summary by incorporating the new conversation.

                Rules:
                - Preserve important context needed to continue future conversations.
                - Keep the summary concise (200-400 words maximum).
                - Include:
                - topics discussed
                - decisions made
                - unresolved questions
                - ongoing tasks
                - important events
                - Do NOT repeat information already present unless it changes.
                - Do NOT store long-term user facts (those belong to another memory system).
                - Remove information that is no longer relevant.
                - Rewrite the summary as a coherent paragraph instead of appending text.

                Return ONLY the updated summary.
                Maximum length: 300 words.
                `
            },
            {
                role: "user",
                content: `
                Previous summary:
                ${summaryText}

                Recent conversation:
                ${latestMessages.map(
                    m => `${m.role}: ${m.content}`
                ).join("\n")}

                Recent ai Message: ${aiMessage}

                Update the summary.
`
            },
        ])

        summaryText = summaryResult.content as string;
        //save the summary to db
        await storeSummarizeMessages({ userId: userID, summarizeText: summaryText as string })
    }
};

export default chatController;

