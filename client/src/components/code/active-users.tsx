"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSocket } from "@/context/socket-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type ActiveUser = {
    userId: string,
    name: string,
    email: string,
    color: string,
}

export default function ActiveUsers() {
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const { socket } = useSocket();
    const { data: session } = useSession();

    useEffect(() => {
        if (!socket) return;

        socket.emit(SocketEvents.USERS_ACTIVE, (data: ActiveUser[]) => {
            Array.isArray(data) && setActiveUsers(data);
        })

        socket.on(SocketEvents.USERS_ACTIVE, (data: ActiveUser[]) => {
            Array.isArray(data) && setActiveUsers(data);
        });

        return () => {
            socket.off(SocketEvents.USERS_ACTIVE);
        }
    }, [socket])

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center">
                {activeUsers.filter(u => u.userId !== session?.user?.userId).map((user, index) => {
                    const words = user.name.split(" ")

                    const firstInitial = words[0] ? words[0][0].toUpperCase() : ""
                    const secondInitial = words[1] ? words[1][0].toUpperCase() : ""

                    return (
                        <Tooltip key={user.userId}>
                            <TooltipTrigger asChild>
                                <button
                                    className={cn(
                                        "relative rounded-full transition-all duration-200 hover:!z-10",
                                        index > 0 && "ml-[-8px]",
                                        activeUsers.length > 2 && "hover:scale-110"
                                    )}
                                    style={{
                                        zIndex: index,
                                    }}
                                >
                                    <Avatar className="shadow-md">
                                        <AvatarFallback className="text-xs text-white" style={{ backgroundColor: user.color }}>
                                            {(firstInitial + secondInitial).slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="px-3 py-2">
                                <div className="text-center">
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <p className="text-xs max-w-[30ch] truncate">{user.email}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}