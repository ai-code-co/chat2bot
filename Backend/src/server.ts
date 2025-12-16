import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import router from "./routes/langChain.js";
import allChatRouter from './routes/chatSliceRoute.js'
import allSessionsRouter from './routes/sessionSliceRoutes.js'
import createUsersTable, { createMemoryTable, createMessagesTable, createSessionTable, updateResponseId } from "./db/model.js";
import crypto from "crypto";
import audioTOText from "./utils/audioToText.js";


const app = express();
app.use(express.json());
app.use(cors());

// HTTP server
const server = http.createServer(app);

// SOCKET INSTANCE
export const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
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
        const text = await audioTOText(audioData)
        console.log("Transcribed text:", text)
        socket.emit("audio_transcribed", text)
    });

    socket.on("disconnect", () => {
        console.log("disconnected")
    })
})

// ROUTES
app.use("/chat", router);
app.use("/chat", allChatRouter)
app.use("/chat", allSessionsRouter)

server.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});
