"use client"

import { Ellipsis, Pencil, TrashIcon } from "lucide-react"


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarItemProps {
    onRename: () => void;
    onDelete: () => void;
}

export function SidebarItem({ onRename, onDelete }: SidebarItemProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="lg:opacity-0 lg:group-hover:opacity-100 data-[state=open]:opacity-100 cursor-pointer p-1  transition-all duration-150"
                >
                    <Ellipsis size={16} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#2a2d31] text-white border border-[#3f424b]">
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="focus:bg-[#32353b]"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRename()
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span className="text-white/80">Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className=""
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                    >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        <span className="text-white/80">Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

