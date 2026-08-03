import axios from "axios"


export const fetchSessionsById =async(userId:string,searchText:string)=>{
    const res =await axios.post(`${import.meta.env.VITE_BACKEND_URL}/chat/getAllSessions/${userId}`,{
        searchText
    })
    return res.data
} 

export const deleteSessionApi = async (sessionId: string) => {
    const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/chat/deleteSession/${sessionId}`)
    return res.data
}

export const updateSessionTitleApi = async (sessionId: string, title: string) => {
    const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/chat/updateSessionTitle/${sessionId}`, { title })
    return res.data
}

export const toggleSaveSessionApi = async (sessionId: string) => {
    const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/chat/toggleSaveSession/${sessionId}`)
    return res.data
}

