import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProfileAvatar } from '../ui/avatar'
import { Button } from '../ui/button'
import { signOut, useSession } from 'next-auth/react'
import axiosClient from '@/lib/axios-client'
import { useMutation } from '@tanstack/react-query'
import { REFRESH_TOKEN_HEADER } from '@/lib/CONSTANTS'
import { useRouter } from 'next/navigation'
import { Skeleton } from '../ui/skeleton'

export default function ProfileDropdown() {
    const { data, status } = useSession();
    const router = useRouter();

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async () => {
            await axiosClient.post(`/auth/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${data?.backendTokens.access_token}`,
                    [REFRESH_TOKEN_HEADER]: data?.backendTokens.refresh_token
                }
            });
        },
    });

    const handleLogout = async () => {
        signOut();
        await mutateAsync();
    }

    if (status === "unauthenticated") router.push("/auth/login");

    if (status === "loading") return (
        <div className='p-1 flex items-center'>
            <Skeleton className='size-10 rounded-full' />
        </div>
    )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {
                    data && (
                        <Button variant='ghost' className='rounded-full size-12' size={"icon"}>
                            <ProfileAvatar
                                name={data?.user.firstName + " " + data?.user.lastName}
                                src=''
                                className='size-10'
                            />
                        </Button>
                    )
                }
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='end'>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                >
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    {isPending ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}