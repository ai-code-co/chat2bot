import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import router from "./routes/langChain.js";
import allChatRouter from './routes/chatSliceRoute.js'
import allSessionsRouter from './routes/sessionSliceRoutes.js'
import createUsersTable, { createMemoryTable, createMessagesTable, createSessionTable, migrateMemoryTableAddExtractedFacts, updateResponseId, migrateSessionTableAddIsSaved } from "./db/model.js";
import crypto from "crypto";
import audioTOText from "./utils/audioToText.js";
import audioToTextV2 from "./utils/audioToTextV2.js";

// FRONTEND URL 
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

//PORT 
const PORT = process.env.PORT || 3001

// HTTP server
const server = http.createServer(app);

// SOCKET INSTANCE
export const io = new SocketIOServer(server, {
    cors: corsOptions,
})

// PROMPTS BY SOCKET ID
//export const userPrompts: Record<string, string> = {}
export let isRegenereate: boolean = false
export let socketId: string | null = null
export let userPrompt: string = ""
export let userID: string = ""
export let sessionID: string = ""

// call DB
async function initDB() {
    await createUsersTable()
    await createSessionTable()
    await createMessagesTable()
    await createMemoryTable()
    await migrateMemoryTableAddExtractedFacts()
    await migrateSessionTableAddIsSaved()
}
initDB()


io.on("connection", (socket) => {
    console.log("User connected:", socket.id)
    socket.emit("socket_id", socket.id)

    // Get prompt 
    socket.on("send_prompt", ({ userId, sessionId, text, regenereate }) => {
        userPrompt = text
        userID = userId
        if (!sessionId) {
            sessionID = crypto.randomUUID()
        }
        else {
            sessionID = sessionId
        }
        isRegenereate = regenereate
    })

    socket.on("update_messages", async (responseId) => {
        await updateResponseId({ responseId });
    });

    socket.on("send_audioFile", async (audioData) => {
        try {
            const text = await audioToTextV2(audioData);

            socket.emit(
                "audio_transcribed",
                text
            )
        }
        catch (error) {

            console.error(
                "Audio transcription failed:",
                error
            )

            socket.emit(
                "audio_transcribed",
                ""
            )
        }
    })

    socket.on("disconnect", () => {
        console.log("disconnected")
    })
})

// ROUTES
app.use("/chat", router);
app.use("/chat", allChatRouter)
app.use("/chat", allSessionsRouter)

server.listen(PORT, () => {
    console.log("Server running at http://localhost:3001");
});
