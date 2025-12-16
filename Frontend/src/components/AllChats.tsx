import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setSessionId } from '@/features/globalstate/sessionState'
import { fetchAllSessions, type sessionProps } from '@/features/sessions/sessions'
import { auth } from '@/utils/FirebaseInit'
import { useEffect, useState } from 'react'

const AllChats = ({searchText}:{searchText:string}) => {
    const userId = localStorage.getItem("userId") ?? sessionStorage.getItem("userId") ?? "" 
    const dispatch = useAppDispatch()

    const currentSession = useAppSelector((state)=>state.globalState.currentSessionId)

    useEffect(() => {
        dispatch(fetchAllSessions({ userId ,searchText}))
    }, [currentSession,searchText])

    const sessionList = useAppSelector((state) => state.sessions)

    const handleSessionId=({sessionId}:{sessionId:string})=>{
        dispatch(setSessionId(sessionId))
    }
    return (
        <div className='w-full flex flex-col gap-2 h-full' >
            
            {sessionList.map((s) => {
                return <div className={`${currentSession ===s.sessionId ? 'bg-[#0f1011]':'bg-[#292a2e]'} w-70 flex flex-col gap-2 hover:bg-[#1E1F22] p-5 rounded-md`} onClick={()=>handleSessionId({sessionId:s.sessionId})} key={s.sessionId}>
                    {/* title */}
                    <div className='flex justify-between gap-8'>
                        <div className='text-sm font-bold'>{s.title}</div>
                        <div className='text-[0.8rem] text-[#ABABAB]'>{new Date(s.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        })}</div>
                    </div>
                    <div className='break-words text-[#ABABAB] text-[0.8rem]'>
                        {s.lastMessage?.length ? s.lastMessage.slice(0,50) : "No message yet"}...
                    </div>
                </div>
            })}
        </div>
    )
}

export default AllChats