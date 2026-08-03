import type { Request, Response } from "express";
import { allUserSessions, deleteSession, updateSessionTitle, toggleSaveSession } from "../db/model.js";

type SessionParams = {
    sessionId: string;
}
type UserParams = {
    userId: string;
}

export const getAllSessions = async (req: Request<UserParams>, res: Response) => {
    const userId = req.params.userId
    const { searchText } = req.body

    if (userId) {
        const sessions = await allUserSessions({ userId, userInput: searchText as string })
        res.status(200).json({
            "result": sessions
        })
    }
    else {
        // console.log("Error: userId is empty.")
        res.status(500).json({
            "message": "Error: userId is empty."
        })
    }
}

export const deleteSessionController = async (req: Request<SessionParams>, res: Response) => {
    const sessionId = req.params.sessionId
    if (sessionId) {
        try {
            const deleted = await deleteSession(sessionId)
            res.status(200).json({
                success: true,
                result: deleted
            })
        } catch (error) {
            res.status(500).json({
                message: "Error deleting session: " + (error as Error).message
            })
        }
    } else {
        res.status(400).json({
            message: "Error: sessionId is empty."
        })
    }
}

export const updateSessionTitleController = async (req: Request<SessionParams>, res: Response) => {
    const sessionId = req.params.sessionId
    const { title } = req.body;
    if (sessionId && title !== undefined) {
        try {
            const updated = await updateSessionTitle({ sessionId, title })
            res.status(200).json({
                success: true,
                result: updated
            })
        } catch (error) {
            res.status(500).json({
                message: "Error updating session title: " + (error as Error).message
            })
        }
    } else {
        res.status(400).json({
            message: "Error: sessionId or title is empty."
        })
    }
}

export const toggleSaveSessionController = async (req: Request<SessionParams>, res: Response) => {
    const sessionId = req.params.sessionId;
    if (sessionId) {
        try {
            const updated = await toggleSaveSession(sessionId)
            res.status(200).json({
                success: true,
                result: updated
            })
        } catch (error) {
            res.status(500).json({
                message: "Error toggling session save: " + (error as Error).message
            })
        }
    } else {
        res.status(400).json({
            message: "Error: sessionId is empty."
        })
    }
}

