import ChatBot from './ChatBot'
const Message = () => {
    return (
        <div className='ml-3 pb-3 mr-3 w-full h-full flex flex-col p-1' >

           {/* TopBar */}
            <div className='flex justify-between text-white h-8 w-full'>
                {/* title */}
                <div className='font-semibold text-2xl'>Messages</div>
                
                {/* search and three buttons */}
                {/* <div className='flex gap-2'>
                    <div className='bg-[#1E1F22] rounded-md flex justify-center items-center w-[1.9rem] h-[1.9rem] '><Search size={18}/></div>
                    <div className='bg-[#1E1F22] rounded-md flex justify-center items-center w-[1.9rem] h-[1.9rem] '><Ellipsis/></div>
                </div> */}
            </div>

              {/* Main content */}
            <div className='mt-2 h-full w-full bg-[#3F424A] rounded-md overflow-y-scroll chat-messages'>
             <ChatBot/>
            </div>
        </div>
    )
}

export default Message