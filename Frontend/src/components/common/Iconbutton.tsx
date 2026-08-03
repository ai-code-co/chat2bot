import React, { useMemo } from "react";
import { MessageCircle, Settings } from "lucide-react";
import logo from "/logo1.svg";
import ChatHistory from "../ChatHistory";

const IconButton = ({ icon, active, click }: {
  icon: React.ReactNode;
  active?: boolean;
  click?: () => void;
}) => {
  return (
    <button
      onClick={click}
      className={`flex items-center justify-center w-8 h-8 rounded-md transition-all
      ${active ? "bg-[#15c37a] text-white shadow-lg" : "bg-[#2a2d31] text-gray-400 hover:bg-[#333639]"}`}
    >
      {icon}
    </button>
  )
}


export default function Sidebar() {
  const [activeTab, setActiveTab] = React.useState("");
  const [isChatPanelOpen, setIsChatPanelOpen] = React.useState(false);

  const sidePanelWidth = useMemo(() => isChatPanelOpen ? 'w-16 sm:w-[30rem]' : 'w-16', [isChatPanelOpen]);

  const toggleSidePannel = (props: string) => {
    if (activeTab === props) {
      setActiveTab("");
      setIsChatPanelOpen(false);
    } else {
      setActiveTab(props);
      setIsChatPanelOpen(true);
    }
  }

  return (
    <div className={`${sidePanelWidth} h-full flex relative`}>
      {/* icons pannel  */}
      <div className={` h-full w-16 shrink-0 bg-[#1f2124] border-r border-[#2c2e32] flex flex-col items-center py-6 gap-6`}>

        {/* Logo */}
        <div className="w-8 h-8 rounded-2xl bg-[#2a2d31] flex items-center justify-center">
          <img src={logo} alt="Logo" className="w-18 h-18 rounded-md" />
        </div>

        {/* Icons */}
        <div className="flex flex-col items-center gap-4 mt-7">
          <IconButton
            icon={<MessageCircle size={18} />}
            active={activeTab === "chat"}
            click={() => toggleSidePannel('chat')}
          />
        </div>

        {/* Bottom Icon */}
        <div className="mt-auto">
          <IconButton
            icon={<Settings size={18} />}
            active={activeTab === "settings"}
            click={() => setActiveTab(activeTab === "settings" ? "" : "settings")}
          />
        </div>
      </div>

      {/* Content Area */}
      <div
        className={`overflow-hidden min-w-0 ${isChatPanelOpen ? "flex-1" : "w-0"}`}
      >
        {isChatPanelOpen && <ChatHistory />}
      </div>

    </div>
  );
}
