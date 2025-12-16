import type { Request, Response } from "express";
import { allUserSessions } from "../db/model.js";


export const getAllSessions=async(req:Request,res:Response)=>{
    const {userId} = req.params
    const {searchText} = req.body

    if(userId){
        const sessions = await allUserSessions({userId,userInput:searchText as string})
        res.status(200).json({
            "result":sessions
        })
    }
    else{
        // console.log("Error: userId is empty.")
        res.status(500).json({
            "message":"Error: userId is empty."
        })
    }
}
