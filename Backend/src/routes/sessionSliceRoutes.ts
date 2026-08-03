import express from "express";
import { getAllSessions, deleteSessionController, updateSessionTitleController, toggleSaveSessionController } from "../controllers/fetchSessions.js";

const router = express.Router();


router.post("/getAllSessions/:userId/",getAllSessions)
router.delete("/deleteSession/:sessionId", deleteSessionController)
router.put("/updateSessionTitle/:sessionId", updateSessionTitleController)
router.put("/toggleSaveSession/:sessionId", toggleSaveSessionController)

export default router;
