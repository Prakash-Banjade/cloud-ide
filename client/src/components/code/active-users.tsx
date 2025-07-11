"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSocket } from "@/context/socket-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCodingStates } from "@/context/coding-states-provider";
import { toggleDecorations } from "./editor/editor-utils";

export type RemoteUser = {
    userId: string,
    name: string,
    email: string,
    color: string,
}

export default function ActiveUsers() {
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const { socket } = useSocket();
    const { data: session } = useSession();

    useEffect(() => {
        if (!socket) return;

        socket.emit(SocketEvents.USERS_ACTIVE, (data: RemoteUser[]) => {
            Array.isArray(data) && setRemoteUsers(data);
        })

        socket.on(SocketEvents.USERS_ACTIVE, (data: RemoteUser[]) => {
            Array.isArray(data) && setRemoteUsers(data);
        });

        return () => {
            socket.off(SocketEvents.USERS_ACTIVE);
        }
    }, [socket])

    return (
        <div className="flex items-center">
            {remoteUsers.filter(u => u.userId !== session?.user?.userId).map((user, index) => {
                return (
                    <AvatarDropdown
                        key={user.userId}
                        user={user}
                        remoteUsers={remoteUsers}
                        index={index}
                    />
                )
            })}
        </div>
    )
}

function AvatarDropdown({ user, remoteUsers, index }: { user: RemoteUser, index: number, remoteUsers: RemoteUser[] }) {
    const { mutedUsers, setMutedUsers } = useCodingStates();
    const [open, setOpen] = useState(false);

    const words = user.name.split(" ")
    const firstInitial = words[0] ? words[0][0].toUpperCase() : ""
    const secondInitial = words[1] ? words[1][0].toUpperCase() : ""

    const isMuted = mutedUsers.includes(user.userId);

    function handleMute() {
        if (isMuted) {
            setMutedUsers(prev => [...prev.filter(u => u !== user.userId)]);
            toggleDecorations(user.userId, false);
        } else {
            setMutedUsers(prev => [...prev, user.userId]);
            toggleDecorations(user.userId, true);
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "relative rounded-full transition-all duration-200 hover:!z-10 focus:!z-10",
                        index > 0 && "ml-[-8px]",
                        remoteUsers.length > 2 && "hover:scale-110 focus:scale-110",
                        open && "!z-10 scale-110"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel className="max-w-[30ch] truncate" title={user.name}>
                    {user.name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleMute}>
                    {
                        isMuted ? "Unmute" : "Mute"
                    }
                </DropdownMenuItem>
                {/* <DropdownMenuItem
                    onClick={() => {
                        setObservedUser(user)
                    }}
                >
                    Watch
                </DropdownMenuItem> */}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}