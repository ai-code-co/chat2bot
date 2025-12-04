
import { useEffect, useRef, useState } from "react";
import { socket } from "../App";
import axios from "axios";

const ChatBot = () => {
    const [userMessage, setUserMessage] = useState("");
    const [socketId, setSocketId] = useState("");
    const [allMessages, setAllMessages] = useState([
        { role: "ai", content: "hey! how are you doing today? 😊" },
    ])

    const [connect, setConnect] = useState(true)

    // toggle button
    useEffect(() => {

        connect ? (socket.disconnect(),console.log("socket disconnected") ): (socket.connect() ,console.log("socket connected"))
        
    }, [connect])


    useEffect(() => {
        socket.connect()

        socket.on("socket_id", (id) => {
            setSocketId(id)
        });

        socket.on("send_chunks", (chunk) => {
            setAllMessages((prev) => {
                const last = prev[prev.length - 1]

                if (last?.role === "ai") {
                    last.content += chunk;

                    // el -->(new chunk "lo")--> hello
                    return [...prev.slice(0, -1), last]
                }

                return [...prev, { role: "ai", content: chunk }]
            })
        })

        return () => {
            socket.off("send_chunks");
            socket.off("socket_id");
        };
    }, []);

    const sendButton = async () => {
        if (!userMessage.trim()) return;

        // Add user message
        setAllMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
            { role: "ai", content: "" },
        ]);

        // Send prompt to server via socket
        socket.emit("send_prompt", {
            userId:socketId,
            text: userMessage,
        });

        // Trigger LangChain processing
        await axios.post("http://localhost:3001/chat/langchain/image", {
            socketId,
        });

        setUserMessage("");

    };

    return (
        <div className="w-[42rem] h-screen border bg-blue-900 text-white p-3 rounded-lg">
            <div className="uppercase flex items-center justify-center font-semibold">Friend Bot</div>
            <div className="w-full h-[30rem] bg-white text-black rounded overflow-y-auto p-3">
                {allMessages.map((m, i) => (
                    <div
                        key={i}
                        className={`p-2 my-2 max-w-[20rem] rounded ${m.role === "user"
                            ? "ml-auto bg-gray-200"
                            : "mr-auto bg-blue-300"
                            }`}
                    >
                        {/^(http|https):\/\//.test(m.content) ? (
                            <img src={m.content} className="rounded" />
                        ) : (
                            m.content 
                        )}
                    </div>
                ))}
            </div>

            <textarea
                className="w-full mt-4 bg-white text-black p-2 rounded resize-none mt-8"
                value={userMessage}
                rows={3}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendButton()
                    }
                }}
            />

            <div className="flex gap-2">
                <button
                    onClick={sendButton}
                    className="mt-2 px-4 py-1 bg-white text-black rounded"
                >
                    Send
                </button>
                {/* <button

                    className={`mt-2 px-4 py-1 bg-white text-black rounded ${connect ? '' : 'animate-pulse'}`}
                    onClick={() => setConnect(prev => !prev)}
                >
                    {connect ? 'Connect' : 'Disconnect'}
                </button> */}
            </div>
        </div>
    );
};

export default ChatBot;
