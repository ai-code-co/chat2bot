import { Plus, Ellipsis } from "lucide-react";
import Tab from './common/Tab';
import SearchWithFilter from './common/Searchbar';
import AllChats from './AllChats';
import { useAppDispatch } from '@/app/hooks';
import { resetGlobalState } from '@/features/globalstate/sessionState';
import { resetChats } from '@/features/chats/chats';
import { useState } from "react";

const ChatHistory = () => {
    const dispatch = useAppDispatch()
    const [searchText, setSearchText] = useState("")
    

    const handleClick =()=>{
        dispatch(resetGlobalState())
        dispatch(resetChats())
    }
    return (
        <div className='w-full h-full p-2 relative flex flex-col gap-4'>
            {/* Top bar */}
            <div className='flex justify-between'>

                {/* Title */}
                <div className='font-semibold text-white text-2xl'>My Chats</div>

                <div className='flex gap-2'>
                    <button className='bg-[#15c37a] text-white rounded-md flex items-center justify-center w-[1.8rem] h-[1.8rem]'
                    onClick={()=>handleClick()}><Plus size={18}/></button>
                    {/* <button className='bg-[#1E1F22] text-white rounded-md flex items-center justify-center w-[1.8rem] h-[1.8rem]'><Ellipsis /></button> */}
                </div>
            </div>

            {/* Toggle button */}
            <div className=''>
                <Tab props={["Chats","Saved"]} design='w-full h-[3rem] text-[#15c37a] bg-[#575B65] ' defaultTab='Chats'/>
            </div>

            {/* Search bar with filter */}
            <div className=''>
                <SearchWithFilter onSearch={setSearchText}/>
            </div>

            {/* All Chats */}
            <div className='overflow-y-scroll chat-messages mt-2 rounded-md text-white flex items-center justify-center '>
                <AllChats searchText={searchText}/>
            </div>
        </div>
    )
}

export default ChatHistory