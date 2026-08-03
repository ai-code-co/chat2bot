import { useEffect, useRef, useState } from "react";
import { socket, socketInitialize } from "@/services/socketInitialize";
import axios from "axios";
import { Copy, Mic, RefreshCcw, Send, Square } from "lucide-react";
import user from "/user.svg";
import logo from "/logo1.svg";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchAllChats } from "@/features/chats/chats";
import { setSessionId } from "@/features/globalstate/sessionState";
import { addNewSessions, updateLastMessage } from "@/features/sessions/sessions";


export type MessageProps = {
    role: "user" | "assistant" | "",
    content: string,
    messageId?: string
}

const ChatBot = () => {
    const dispatch = useAppDispatch()
    const sessionId = useAppSelector(state => state.globalState.currentSessionId)
    // const chatList = useAppSelector((state) => state.chats)
    const userId = localStorage.getItem("userId") ?? sessionStorage.getItem("userId") ?? ""

    const { messages: chatList, loading: fetchLoading, error } = useAppSelector((state) => state.chats)
    let [userMessage, setUserMessage] = useState("")
    const socketIdRef = useRef<string | null>(null)
    const [allMessages, setAllMessages] = useState<MessageProps[]>(chatList)
    const [isRecording, setIsRecording] = useState(false)
    const regenerateRef = useRef(false)
    const [isGenerating, setIsGenerating] = useState(false)
    // const messageRef = useRef<HTMLDivElement>(null)
    const [audioBlob, setAudioBlob] = useState<Blob>()
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false)


    useEffect(() => {
        if (!sessionId) return
        dispatch(fetchAllChats({ sessionId }))
    }, [sessionId])

    useEffect(() => {
        setAllMessages(chatList);
    }, [chatList]);


    useEffect(() => {
        const startRecording = async () => {
            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    })

                // Save the microphone stream
                mediaStreamRef.current = stream

                const supportedMimeType =
                    MediaRecorder.isTypeSupported(
                        "audio/webm;codecs=opus"
                    )
                        ? "audio/webm;codecs=opus"
                        : "audio/webm"
                const mediaRecorder =
                    new MediaRecorder(stream, {
                        mimeType: supportedMimeType
                    })

                mediaRecorderRef.current = mediaRecorder

                const chunks: Blob[] = []

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data)
                    }
                }

                mediaRecorder.onstop = () => {
                    const blob = new Blob(
                        chunks,
                        {
                            type: supportedMimeType
                        }
                    )

                    setAudioBlob(blob);

                    // Stop the actual microphone
                    mediaStreamRef.current
                        ?.getTracks()
                        .forEach(track => {
                            track.stop();
                        });

                    mediaStreamRef.current = null;
                    mediaRecorderRef.current = null;
                }

                mediaRecorder.start()
            } catch (error) {
                console.error(
                    "Could not access microphone:",
                    error
                );

                setIsRecording(false)

                alert(
                    "Microphone access failed. Please allow microphone permission."
                )
            }
        };

        if (isRecording) {
            startRecording()
        } else {
            const recorder =
                mediaRecorderRef.current;

            if (
                recorder &&
                recorder.state !== "inactive"
            ) {
                recorder.stop()
            }
        }

        return () => {
            const recorder =
                mediaRecorderRef.current;

            if (
                recorder &&
                recorder.state !== "inactive"
            ) {
                recorder.stop();
            }
        }
    }, [isRecording])

    useEffect(() => {
        if (!audioBlob) return;
        const sendAudio = async () => {
            try {
                setIsTranscribing(true);

                const arrayBuffer =
                    await audioBlob.arrayBuffer();

                socket.emit(
                    "send_audioFile",
                    arrayBuffer
                )
            }
            catch (error) {
                console.error(error);
                setIsTranscribing(false);
            }
        }
        sendAudio()
    }, [audioBlob])

    useEffect(() => {
        if (!socket) {
            socketInitialize()
        }
        socket.on("connection", () => {
            if (socket.id) {
                socketIdRef.current = socket.id
            }

        })
        socket.on("socket_id", () => {
        });

        socket.on("send_chunks", (chunk) => {
            setAllMessages((prev) => {
                const last = prev[prev.length - 1]

                if (last?.role === "assistant") {
                    const updatedLast = {
                        ...last,
                        content: last.content + chunk
                    }

                    return [...prev.slice(0, -1), updatedLast]
                }

                return [...prev, { role: "assistant", content: chunk }]
            })
        })

        socket.on(
            "update_sidebar_last_message",
            (updatedSessionId, lastMessage) => {
                dispatch(
                    updateLastMessage({
                        sessionId: updatedSessionId,
                        lastMessage
                    })
                )
            }
        )

        socket.on("send_messageId", (id1, id2) => {
            setAllMessages((prev) => {
                if (prev.length < 2) return prev;

                const newPrev = prev.map(m => ({ ...m }))

                const lastIndex = newPrev.length - 1;
                const secondLastIndex = newPrev.length - 2;

                if (newPrev[lastIndex].role === "assistant") {
                    newPrev[lastIndex] = {
                        ...newPrev[lastIndex],
                        messageId: id1
                    };
                }

                if (id2 !== "") {
                    if (newPrev[secondLastIndex].role === "user") {
                        newPrev[secondLastIndex] = {
                            ...newPrev[secondLastIndex],
                            messageId: id2
                        };
                    }
                }


                return newPrev;
            })
        })

        socket.on("send_sessionId_with_title", (sID, title) => {
            dispatch(setSessionId(sID))

            dispatch(
                addNewSessions({
                    sessionId: sID,
                    userId,
                    title: title || "New Chat",
                    createdAt: new Date().toISOString(),
                    lastMessage: "",
                    isSaved: false
                })
            )

        })

        socket.on("audio_transcribed", (text) => {
            setUserMessage(text)
            setIsTranscribing(false)
        })

        return () => {
            socket.off("connection")
            socket.off("socket_id")
            socket.off("send_chunks")
            socket.off("send_messageId")
            socket.off("audio_transcribed")
            socket.off("send_sessionId_with_title")
            socket.off("update_sidebar_last_message")
        }
    }, [])

    const sendButton = async (
        overrideMessage?: string
    ) => {
        const finalMessage =
            overrideMessage ?? userMessage

        if (!finalMessage.trim()) return

        const shouldRegenerate = regenerateRef.current

        regenerateRef.current = false

        setIsGenerating(true)

        try {
            // Add user message
            if (!overrideMessage) {
                setAllMessages((prev) => [
                    ...prev,
                    {
                        role: "user",
                        content: finalMessage,
                        messageId: ""
                    },
                    {
                        role: "assistant",
                        content: "",
                        messageId: ""
                    }
                ])

                setUserMessage("")
            }
            // Send prompt to server via socket
            socket.emit("send_prompt", {
                userId,
                sessionId,
                text: finalMessage,
                regenereate: shouldRegenerate
            })
            // Trigger LangChain processing
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/chat/respond`,
                {
                    socketId: socket.id
                }
            )
        } catch (error) {
            console.error(
                "Failed to generate response:",
                error
            )
        } finally {
            setIsGenerating(false)
        }
    }


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
    }


    const handleGenereateResponse = async (messageId: string) => {
        if (messageId) {
            let userTextResend = ""
            // ui update
            setAllMessages((prev) => {
                const idx = prev.findIndex(m => m.messageId === messageId)
                if (idx === -1) return prev


                const newList = [...prev]
                userTextResend = newList[idx - 1].content
                newList[idx] = { ...newList[idx], content: "", messageId: "" }
                const trimmedList = newList.slice(0, idx + 1)
                return trimmedList
            })

            // db update
            socket.emit("update_messages", messageId)

            // To genereate new response 
            setTimeout(() => {
                regenerateRef.current = true
                sendButton(userTextResend)
            }, 500);

        }
        else {
            throw new Error('messgeId not provided.')
        }
    };

    if (fetchLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#3F424A] text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-500" />

                <p className="text-sm font-medium text-gray-300">
                    Loading chats...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[#3F424A] px-4">
                <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center shadow-lg">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-400">
                        !
                    </div>

                    <h2 className="text-lg font-semibold text-red-300">
                        Failed to load chats
                    </h2>

                    <p className="mt-2 break-words text-sm text-gray-300">
                        {error}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col items-center ${(allMessages.length > 0 && allMessages[0].role.length > 0) ? '' : 'justify-center'} mx-auto w-full h-full bg-[#3F424A] text-white px-2 sm:px-6 md:px-10 `}>
            {/* chats */}
            {(allMessages.length > 0 && allMessages[0].role.length > 0) ?
                <div className="w-full lg:w-3/4 mt-2 flex-1 py-5 pb-24">
                    {allMessages.map((m, i) => (
                        <div key={i} className="mb-2">

                            {/* Role Header */}
                            <div className="font-semibold">
                                {m.role === "user" ? (
                                    <div className="flex gap-3">
                                        <img src={user} alt="user" className="w-5 h-5 rounded-full" />
                                        You
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <img src={logo} alt="bot" className="w-5 h-5 rounded-full" />
                                        Response
                                    </div>
                                )}
                            </div>

                            {/* Message Content */}
                            <div
                                className={`
                            inline-block p-5 rounded-lg wrap-break-word text-[0.9rem]
                            max-w-[100%] text-justify
                            ${m.role === "user" ? "bg-[#4b4f5b]" :
                                        m.content.length > 0 ? "bg-[#282f3f] "
                                            : "bg-[#282f3f] animate-pulse "
                                    }
                            `}
                            >
                                {/^(http|https):\/\//.test(m.content) ? (

                                    <img src={m.content} className="rounded" />

                                ) : (
                                    m.role === "assistant" ?
                                        <div className="flex flex-col">
                                            <div>{m.content}</div>
                                            {m.messageId ?
                                                <div className="mt-4 flex gap-3 justify-end">
                                                    <div className="text-[0.7rem] bg-[#202633] rounded-md p-2 hover:bg-[#121722] cursor-pointer">
                                                        <button className="flex items-center gap-1" onClick={() => {
                                                            if (m.messageId) {

                                                                handleGenereateResponse(m.messageId)

                                                            }
                                                            else {
                                                            }
                                                        }}><RefreshCcw size={12} /><span className="hidden sm:inline-block">Generate Response</span>
                                                        </button>
                                                    </div>
                                                    <div className="text-[0.7rem] bg-[#202633] rounded-md p-2 hover:bg-[#121722] cursor-pointer">
                                                        <button className="flex items-center gap-1 " onClick={() => handleCopy(m.content)}>
                                                            <Copy size={12} /><span className="hidden sm:inline-block">Copy</span>
                                                        </button>
                                                    </div>
                                                </div> : <div></div>
                                            }
                                        </div> : m.content
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                :
                <div className="text-xl sm:text-xl md:text-2xl lg:text-3xl mb-4 text-center flex-1 flex items-center md:flex-none md:block">
                    What's on your mind today?
                </div>
            }

            <div className="w-full lg:w-4/6 sticky bottom-0  py-3 z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-3 bg-[#2b2c30] px-1 sm:px-4 py-3 rounded-xl border border-[#3a3b3f]">
                    {/* Text input */}
                    <textarea
                        rows={1}
                        placeholder="Ask questions..."
                        value={userMessage}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-sm resize-none p-1 leading-6 textarea-scroll max-h-[72px] overflow-y-auto"
                        onChange={(e) => {

                            setUserMessage(e.target.value)

                            e.target.style.height = "auto"

                            e.target.style.height = `${Math.min(e.target.scrollHeight, 72)}px`

                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendButton()
                            }
                        }}
                        disabled={isGenerating}
                    />
                    <div className="flex justify-end shrink-0">
                        {/* Send Button */}
                        <button className={`p-2 rounded-lg transition
                            ${isGenerating
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-[#3a3b3f]"
                            }
                        `}
                            onClick={() => sendButton()}>
                            <Send size={18} className="text-gray-300" />
                        </button>
                        {/* Mic Button */}
                        <button
                            className={`p-2 rounded-lg transition ${isTranscribing ? "cursor-not-allowed opacity-50" : "hover:bg-[#3a3b3f]"}`}
                            disabled={isTranscribing}
                            onClick={() =>
                                setIsRecording(prev => !prev)
                            }
                        >
                            {isTranscribing ? (
                                <div className=" w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                            ) : isRecording ? (
                                <Square size={20} className="text-red-400 animate-pulse" />
                            ) : (
                                < Mic size={20} className="text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;

