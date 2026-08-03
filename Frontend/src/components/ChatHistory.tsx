import { Plus } from "lucide-react";
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
    const [activeTab, setActiveTab] = useState("Chats")


    const handleClick = () => {
        dispatch(resetGlobalState())
        dispatch(resetChats())
    }
    return (
        <div className='bg-[#1f2124]  h-full left-16 top-0  w-[calc(100vw-4rem)] absolute p-2 z-50 sm:relative sm:left-auto sm:top-auto sm:z-auto sm:w-full flex flex-col gap-4'>
            {/* Top bar */}
            <div className='flex justify-between'>

                {/* Title */}
                <div className='font-semibold text-white text-lg md:text-xl lg:text-2xl'>My Chats</div>

                <div className='flex gap-2'>
                    <button className='bg-[#15c37a] text-white rounded-md flex items-center justify-center w-[1.8rem] h-[1.8rem]'
                        onClick={() => handleClick()}><Plus size={18} /></button>
                </div>
            </div>

            {/* Toggle button */}
            <div className=''>
                <Tab props={["Chats", "Saved"]} design='w-full h-[2.8rem] text-[#15c37a] bg-[#575B65]' activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Search bar with filter */}
            <div className=''>
                <SearchWithFilter onSearch={setSearchText} />
            </div>

            {/* All Chats */}
            <div className='overflow-y-auto chat-history-messages mt-2 rounded-md text-white flex-1 min-h-0'>
                <AllChats searchText={searchText} activeTab={activeTab} />
            </div>
        </div>
    )
}


export default ChatHistory
