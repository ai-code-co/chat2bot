import { io,type Socket } from "socket.io-client";

let socket:Socket;
const socketInitialize = () => {
  socket =  io(import.meta.env.VITE_BACKEND_URL,{
    autoConnect:true
  });
}

export  {
  socket,
  socketInitialize
}

