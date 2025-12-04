import express from "express";

import imageGeneration from "../controllers/imageGeneration.js";

const router = express.Router();


router.post("/langchain/image",imageGeneration)

export default router;
