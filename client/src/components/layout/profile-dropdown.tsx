import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProfileAvatar } from '../ui/avatar'
import { Button } from '../ui/button'
import { signOut, useSession } from 'next-auth/react'
import axiosClient from '@/lib/axios-client'
import { useMutation } from '@tanstack/react-query'
import { REFRESH_TOKEN_HEADER } from '@/lib/CONSTANTS'
import { useRouter } from 'next/navigation'
import { Skeleton } from '../ui/skeleton'
import { EllipsisVertical, FolderKanban, LogOut, Moon, Newspaper, Settings, Sun, SunMoon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useTransition } from "react"

export default function ProfileDropdown() {
    const { data, status } = useSession();
    const router = useRouter();
    const isMobile = useIsMobile();
    const { setTheme } = useTheme()
    const [isPending, startTransition] = useTransition()

    const { mutateAsync } = useMutation({
        mutationFn: async () => {
            await axiosClient.post(`/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${data?.backendTokens.access_token}`,
                    [REFRESH_TOKEN_HEADER]: data?.backendTokens.refresh_token
                }
            });
        },
    });

    const handleLogout = () => {
        startTransition(() => {
            try {
                signOut();
                mutateAsync();
            } catch (e) {
                console.log(e);
            }
        });
    }

    if (status === "loading") return (
        <div className='p-1 flex items-center'>
            <Skeleton className='size-10 rounded-full' />
        </div>
    )

    if (status === "unauthenticated" || !data) {
        router.replace("/auth/login")
        return;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {
                    isMobile ? (
                        <Button variant={'ghost'} size={"icon"}>
                            <EllipsisVertical />
                        </Button>
                    ) : (
                        <button type="button" className="rounded-full">
                            <ProfileAvatar
                                name={data?.user.firstName + " " + data?.user.lastName}
                                src=''
                                className='size-10'
                            />
                        </button>
                    )
                }
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='end'>
                <DropdownMenuLabel className="truncate max-w-[20ch]" title={data?.user.email}>{data?.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/workspace">
                        <FolderKanban /> Workspace
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/docs" target="_blank">
                        <Newspaper /> Documentation
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <SunMoon size={16} className="text-muted-foreground mr-2" />
                        Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun /> Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon /> Dark
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut /> {isPending ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}