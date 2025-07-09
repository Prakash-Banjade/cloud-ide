"use client";

import { Avatar, AvatarFallback, AvatarImage, ProfileAvatar } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOthers } from "@liveblocks/react";

type Props = {}

const activeUsers = [
    {
        id: "1",
        name: "Alice Johnson",
        email: "alice@example.com",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AJ",
    },
    {
        id: "2",
        name: "Bob Smith",
        email: "bob@example.com",
        initials: "BS",
    },
    {
        id: "3",
        name: "Carol Davis",
        email: "carol@example.com",
        initials: "CD",
    },
    {
        id: "4",
        name: "David Wilson",
        email: "david@example.com",
        initials: "DW",
    },
    {
        id: "5",
        name: "Emma Brown",
        email: "emma@example.com",
        initials: "EB",
    },
    {
        id: "6",
        name: "Frank Miller",
        email: "frank@example.com",
        initials: "FM",
    },
    {
        id: "7",
        name: "Grace Lee",
        email: "grace@example.com",
        initials: "GL",
    },
]

const VISIBLE_USERS_COUNT = 3;

export default function ActiveUsers({ }: Props) {
    const users = useOthers();

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center">
                {users.slice(0, VISIBLE_USERS_COUNT).map(({ info: user }, index) => (
                    <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                            <button
                                className={cn(
                                    "relative rounded-full transition-all duration-200 hover:z-10 hover:scale-110",
                                    index > 0 && "ml-[-8px]",
                                    "hover:!z-10"
                                )}
                                style={{
                                    zIndex: VISIBLE_USERS_COUNT - index,
                                }}
                            >
                                <ProfileAvatar
                                    src={undefined}
                                    className="size-8 ring-1 ring-white/50 text-xs"
                                    name={user.firstName + ' ' + user.lastName}
                                />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="px-3 py-2">
                            <div className="text-center">
                                <p className="font-medium text-sm">{user.firstName + ' ' + user.lastName}</p>
                                <p className="text-xs">{user.email}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {users.length > VISIBLE_USERS_COUNT && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="ml-1 rounded-full">
                                <Avatar className="size-8">
                                    <AvatarFallback className="bg-muted text-sm font-medium">
                                        +{users.length - VISIBLE_USERS_COUNT}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuItem>Team</DropdownMenuItem>
                            <DropdownMenuItem>Subscription</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </TooltipProvider>
    )
}