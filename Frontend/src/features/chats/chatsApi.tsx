import axios from "axios"


export const fetchBySessionId =async(sessionId:string)=>{
    const res =await axios.get(`${import.meta.env.VITE_BACKEND_URL}/chat/getAllChats/${sessionId}`)
    return res.data
} 

