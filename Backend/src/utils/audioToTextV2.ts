import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY!
})

const audioToTextV2 = async (data: ArrayBuffer) => {
    try {
        const audioBuffer = Buffer.from(data)

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "audio/webm",
                                data: audioBuffer.toString("base64")
                            }
                        },
                        {
                            text: `
                            Transcribe this audio exactly.

                            Rules:
                            - Return only the spoken text.
                            - Do not add explanations.
                            - Do not summarize.
                            - Do not say "Here is the transcription".
                            - Preserve the original language.
                            `
                        }
                    ]
                }
            ]
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Audio transcription error:", error);
        throw error;
    }
}

export default audioToTextV2