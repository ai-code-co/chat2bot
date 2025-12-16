import type { Request, Response } from "express";
import { allUserMessages2 } from "../db/model.js";

const getAllChats =async(req:Request,res:Response)=>{
    const {sessionId} = req.params

    if(sessionId){
        const messages = await allUserMessages2({sessionId}) 
        res.status(200).json({
            "result":messages
        })
    }
    else{
        //console.log("Error: Either sessionId or userId is empty.")
        res.status(500).json({
            "message":"Error: Either sessionId or userId is empty."
        })
    }
}

export default getAllChats;