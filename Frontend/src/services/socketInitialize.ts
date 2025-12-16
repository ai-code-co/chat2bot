import { io,type Socket } from "socket.io-client";

let socket:Socket;
const socketInitialize = () => {
  socket =  io('http://localhost:3001',{
    autoConnect:true
  });
}

export  {
  socket,
  socketInitialize
}