import { Button } from '../ui/button'
import { ChevronDown, Link, Share2 } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from '../ui/separator'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import LoadingButton from '../loading-button'
import { useAppMutation } from '@/hooks/useAppMutation'
import { ProfileAvatar } from '../ui/avatar'
import { ECollaboratorPermission, ECollaboratorStatus, TCollaborator } from '@/types'
import { useState, useTransition } from 'react'
import { QueryKey } from '@/lib/query-keys'
import { cn, createQueryString } from '@/lib/utils'
import { useCodingStates } from '@/context/coding-states-provider'
import { useFetchData } from '@/hooks/useFetchData'
import { MAX_COLLABORATORS } from '@/lib/CONSTANTS'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

type Props = {}

const formSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }).trim(),
})

export default function SharePopover({ }: Props) {
    const { project } = useCodingStates();
    const { data: session } = useSession();
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" }
    });

    const { data: collaborators } = useFetchData<TCollaborator[]>({
        endpoint: QueryKey.COLLABORATORS,
        queryKey: [QueryKey.COLLABORATORS, project?.id || ""],
        queryString: createQueryString({ projectId: project?.id }),
        options: {
            enabled: project?.id !== undefined
        }
    });

    const { mutateAsync } = useAppMutation();

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (!Array.isArray(collaborators) || !project?.id) return;

        if (collaborators.length >= MAX_COLLABORATORS) {
            toast.error(`You can't invite more than ${MAX_COLLABORATORS} collaborators`);
            return;
        }

        if (data.email === session?.user?.email) {
            toast.error("You can't invite yourself");
            return;
        };

        startTransition(() => {
            mutateAsync({
                endpoint: QueryKey.INVITES + '/send',
                method: 'post',
                data: { email: data.email, projectId: project?.id },
                invalidateTags: [QueryKey.COLLABORATORS],
            });

            form.reset();
        })
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    type="button"
                    size={'sm'}
                >
                    <Share2 />
                    Share
                </Button>
            </PopoverTrigger>
            <PopoverContent side='bottom' align='end' className='w-fit min-w-sm space-y-6'>
                <section className='flex justify-between items-center gap-2'>
                    <p className='font-medium'>Share Project</p>
                    <Button type='button' size={'sm'} variant={'outline'} className='text-xs'>
                        <Link className='size-3' />
                        Copy Link
                    </Button>
                </section>

                <Separator />

                <section>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='flex items-end gap-2'>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Invite</FormLabel>
                                        <FormControl>
                                            <Input type="email" required placeholder="Email Address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <LoadingButton
                                isLoading={isPending}
                                disabled={isPending}
                                type='submit'
                                loadingText='Sending...'
                            >
                                Invite
                            </LoadingButton>
                        </form>
                    </Form>
                </section>

                {
                    session && <section>
                        <section className='space-y-3'>
                            <section className='flex items-center gap-20'>
                                <section className='flex-1 flex items-center gap-2'>
                                    <ProfileAvatar src={undefined} className='size-10' name={session.user.firstName + ' ' + session.user.lastName} />
                                    <section>
                                        <p className='text-sm font-medium'>{session.user.firstName + ' ' + session.user.lastName}</p>
                                        <p className='text-sm text-muted-foreground max-w-[50ch] truncate'>{session.user.email}</p>
                                    </section>
                                </section>

                                <section>
                                    <p className='text-sm text-muted-foreground font-medium px-2.5'>Author</p>
                                </section>
                            </section>

                            {
                                (collaborators || []).map((collaborator) => (
                                    <CollaboratorCard key={collaborator.id} collaborator={collaborator} />
                                ))
                            }
                        </section>
                    </section>
                }
            </PopoverContent>
        </Popover>
    )
}

function CollaboratorCard({ collaborator }: { collaborator: TCollaborator }) {
    const name = collaborator.user?.account
        ? collaborator.user?.account.firstName + ' ' + collaborator.user?.account.lastName
        : null;

    return (
        <section className='flex items-center gap-20'>
            <section className='flex-1 flex items-center gap-2'>
                {
                    name
                        ? <ProfileAvatar src={undefined} className='size-10' name={name} />
                        : <div className='size-10 rounded-full bg-muted' />
                }
                <section>
                    {name && <p className='text-sm font-medium'>{name}</p>}
                    <p className='text-sm text-muted-foreground max-w-[50ch] truncate'>{collaborator.email}</p>
                </section>
            </section>

            <section>
                {
                    collaborator.status === ECollaboratorStatus.PENDING ? (
                        <InvitedAction email={collaborator.email} />
                    ) : collaborator.status === ECollaboratorStatus.ACCEPTED && (
                        <p className='text-sm text-muted-foreground'>Accepted</p>
                    )
                }
            </section>
        </section>
    )
}

function InvitedAction({ email }: { email: string }) {
    const { mutateAsync, isPending } = useAppMutation();
    const [open, setOpen] = useState(false);

    async function handleCancelInvite() {
        mutateAsync({
            endpoint: QueryKey.INVITES + '/cancel' + `?email=${email}`,
            method: 'delete',
            invalidateTags: [QueryKey.COLLABORATORS],
        });

        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button size={'sm'} variant={'ghost'} onClick={() => setOpen(true)}>
                    Invited
                    <ChevronDown className={cn('transition-all', open && 'rotate-180')} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-fit p-1' align='end'>
                <LoadingButton
                    variant={'ghost'}
                    size={'sm'}
                    isLoading={isPending}
                    onClick={handleCancelInvite}
                    loadingText='Cancelling...'
                >
                    Cancel Invitation
                </LoadingButton>
            </PopoverContent>
        </Popover>
    )
}

function AcceptedAction({ collaboratorId }: { collaboratorId: string }) {
    const { mutateAsync: removeCollaborator, isPending: isPendingRemove } = useAppMutation();
    const { mutateAsync: updatePermission, isPending: isPendingUpdate } = useAppMutation();
    const [open, setOpen] = useState(false);

    async function handleRemoveCollaborator() {
        await removeCollaborator({
            endpoint: QueryKey.COLLABORATORS + `/${collaboratorId}`,
            method: 'delete',
            invalidateTags: [QueryKey.COLLABORATORS],
        });

        setOpen(false);
    }

    async function handleUpdatePermission(permission: ECollaboratorPermission) {
        await updatePermission({
            endpoint: QueryKey.COLLABORATORS + `/${collaboratorId}`,
            method: 'patch',
            invalidateTags: [QueryKey.COLLABORATORS],
            data: { permission },
        });

        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button size={'sm'} variant={'ghost'} onClick={() => setOpen(true)}>
                    Invited
                    <ChevronDown className={cn('transition-all', open && 'rotate-180')} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-fit p-1' align='end'>
                <LoadingButton
                    variant={'ghost'}
                    size={'sm'}
                    isLoading={isPendingRemove}
                    onClick={handleRemoveCollaborator}
                    loadingText='Removing...'
                >
                    Remove
                </LoadingButton>
                <LoadingButton
                    variant={'ghost'}
                    size={'sm'}
                    isLoading={isPendingRemove}
                    onClick={handleRemoveCollaborator}
                    loadingText='Removing...'
                >
                    Remove
                </LoadingButton>
            </PopoverContent>
        </Popover>
    )
}