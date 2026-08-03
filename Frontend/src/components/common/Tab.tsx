import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Bookmark, MessageCircle } from 'lucide-react'

export interface tabProps {
    props: string[],
    design?: string,
    activeTab: string,
    onTabChange: (tab: string) => void
}
const Tab = ({ props, design, activeTab, onTabChange }: tabProps) => {
    return (
        <div>
            <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList className={design} >
                    {props.map((v) => {
                        return <TabsTrigger value={v} key={v} className='
                        data-[state=active]:bg-[#1f2124]
                                    data-[state=active]:text-[#15c37a]
                                    text-white
                                    uppercase
                                    text-[0.8rem]
                                    '>  {v == "Chats" ?
                                <div className='flex gap-2 text-[0.7rem] sm:text-sm  items-center justify-center'>
                                    <MessageCircle />
                                    CHATS

                                </div>
                                :
                                <div className='flex gap-2 text-[0.7rem] sm:text-sm  items-center justify-center'>
                                    <Bookmark />
                                    SAVED
                                </div>
                            }
                        </TabsTrigger>
                    })
                    }
                </TabsList>
            </Tabs>

        </div>
    )
}

export default Tab
