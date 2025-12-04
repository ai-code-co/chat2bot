import { io } from 'socket.io-client'
import ChatBot from './components/ChatBot';

export const socket = io('http://localhost:3001');

function App(){
    return(
   <div className='flex items-center justify-center bg-slate-200 '>
        <ChatBot/>
    </div>
    )
}

export default App
