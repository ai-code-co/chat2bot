import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setSessionId } from '@/features/globalstate/sessionState'
import { fetchAllSessions, deleteSessionThunk, updateSessionTitleThunk, toggleSaveSessionThunk } from '@/features/sessions/sessions'
import { resetChats } from '@/features/chats/chats'
import { useEffect, useState } from 'react'
import { SidebarItem } from './common/SideBarItem'
import { Heart } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const AllChats = ({ searchText, activeTab }: { searchText: string; activeTab: string }) => {
    const userId = localStorage.getItem("userId") ?? sessionStorage.getItem("userId") ?? ""
    const dispatch = useAppDispatch()

    const currentSession = useAppSelector((state) => state.globalState.currentSessionId)
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

    useEffect(() => {
        dispatch(fetchAllSessions({ userId, searchText }))
    }, [userId, searchText])

    const { sessions, loading, error } = useAppSelector(
        (state) => state.sessions
    )

    const filteredSessions = sessions.filter(s => {
        if (activeTab === "Saved") {
            return s.isSaved
        }
        return true
    })

    const handleSessionId = ({ sessionId }: { sessionId: string }) => {
        dispatch(setSessionId(sessionId))
    }

    const handleDeleteSession = async (sessionId: string) => {
        if (currentSession === sessionId) {
            const remaining = sessions.filter(s => s.sessionId !== sessionId)
            if (remaining.length > 0) {
                dispatch(setSessionId(remaining[0].sessionId))
            } else {
                dispatch(setSessionId(""))
                dispatch(resetChats())
            }
        }
        dispatch(deleteSessionThunk(sessionId))
    }

    const handleRenameSave = async (sessionId: string) => {
        const trimmedTitle = editTitle.trim()
        if (trimmedTitle && trimmedTitle !== sessions.find(s => s.sessionId === sessionId)?.title) {
            dispatch(updateSessionTitleThunk({ sessionId, title: trimmedTitle }))
        }
        setEditingSessionId(null)
    }

    const confirmDelete = () => {
        if (sessionToDelete) {
            handleDeleteSession(sessionToDelete)
            setSessionToDelete(null)
        }
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }

    return (

        <div className="w-full h-full">
            {loading ? (
                <div className="flex p-4  w-full h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
                </div>
            ) : !filteredSessions.length ? (
                <div className="text-center text-[#ABABAB] p-4">
                    {activeTab === "Saved" ? "No saved chats found" : "No chats found"}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filteredSessions.map((s) => {
                        const isEditing = editingSessionId === s.sessionId;
                        return <div className={`${currentSession === s.sessionId ? 'bg-[#0f1011]' : 'bg-[#292a2e]'} w-full flex flex-col gap-2 hover:bg-[#1E1F22] p-5 rounded-md`} onClick={() => {
                            if (!isEditing) {
                                handleSessionId({ sessionId: s.sessionId })
                            }
                        }} key={s.sessionId}>
                            {/* title */}
                            <div className='group flex justify-between gap-8 items-center h-6' title={s.title}>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="text-sm font-bold bg-[#1e2022] text-white border border-[#444] rounded px-2 py-0.5 w-full focus:outline-none focus:border-green-500"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={() => { handleRenameSave(s.sessionId); s.title = editTitle.trim() }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleRenameSave(s.sessionId)
                                                s.title = editTitle.trim()
                                            } else if (e.key === 'Escape') {
                                                setEditingSessionId(null)
                                            }
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className='text-sm font-bold truncate max-w-[150px]'>{s.title}</div>
                                )}

                                {!isEditing && (
                                    <div className='flex items-center gap-2 '>
                                        <SidebarItem
                                            onRename={() => {
                                                setEditingSessionId(s.sessionId)
                                                setEditTitle(s.title)
                                            }}
                                            onDelete={() => {
                                                setSessionToDelete(s.sessionId)
                                            }}
                                        />
                                        <Heart
                                            size={14}
                                            className={`cursor-pointer transition-all duration-150 ${s.isSaved
                                                ? 'fill-[#15c37a] text-[#15c37a] opacity-100'
                                                : 'lg:opacity-0 lg:group-hover:opacity-100 text-[#ABABAB] hover:text-white'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                dispatch(toggleSaveSessionThunk(s.sessionId))
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className='break-words text-[#ABABAB] text-[0.8rem]'>
                                {s.lastMessage?.length ? s.lastMessage.slice(0, 50) : "No message yet"}...
                            </div>
                        </div>
                    })}
                </div>
            )}

            <AlertDialog open={sessionToDelete !== null} onOpenChange={(open) => !open && setSessionToDelete(null)}>
                <AlertDialogContent className="bg-[#2a2d31] text-white border border-[#3f424b]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            Are you sure you want to delete this chat? This action cannot be undone and will delete all messages in this conversation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-[#3f424b] text-white hover:bg-[#32353b] hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AllChats


