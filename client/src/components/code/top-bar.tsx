import ProfileDropdown from '@/components/layout/profile-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCodingStates } from '@/context/coding-states-provider';
import { cn, languageFields } from '@/lib/utils';
import { CircleCheck, Home, LoaderCircle, PanelLeftIcon, Pause, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Socket } from 'socket.io-client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from 'react';
import { SocketEvents } from '@/lib/CONSTANTS';
import { useIsMobile } from '@/hooks/use-mobile';
import ProjectRenameForm from '../workspace/project-rename-form';
import ShareBtn from './share-popover';
import { EPermission } from '@/types/types';
import ActiveUsers from './active-users';

type Props = {
    socket: Socket
}

export default function TopBar({ socket }: Props) {
    const router = useRouter();
    const { isSyncing, project, selectedFile, projectRunning, setProjectRunning, setTreePanelOpen, setShowTerm, permission } = useCodingStates();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile(1000);

    function onRun() {
        if (!socket || !project) return;

        setShowTerm(true); // need to show the terminal when running the project

        socket.emit(SocketEvents.PROCESS_RUN, { lang: project.language, path: selectedFile?.path }, (res: { error: string } | undefined) => {
            if (res?.error) toast.error(res.error);
        });
    }

    function onStop() {
        if (!socket) return;

        socket.emit(SocketEvents.PROCESS_STOP, (res: boolean) => {
            if (res) setProjectRunning(false);
        });
    }

    const Icon = languageFields.find((field) => field.value === project?.language)?.icon || null;

    return (
        <section className='bg-background'>
            <div className="min-h-[50px] relative border-b-2 flex items-center justify-between gap-2 px-4 bg-card/70">
                <div className="flex items-center gap-2">
                    {
                        isMobile ? (
                            <Button
                                type='button'
                                onClick={() => setTreePanelOpen(true)}
                                variant={'ghost'}
                                size={'icon'}
                                className='hover:!bg-secondary'
                            >
                                <PanelLeftIcon />
                            </Button>
                        ) : (
                            <Button
                                type='button'
                                onClick={() => router.push('/workspace')}
                                variant={'ghost'}
                                size={'icon'}
                                className='hover:!bg-secondary'
                            >
                                <Home />
                            </Button>
                        )
                    }

                    <Popover open={permission === EPermission.WRITE && open} onOpenChange={setOpen}>
                        <PopoverTrigger>
                            <section className='flex items-center gap-1 p-2 rounded-sm hover:bg-secondary'>
                                {Icon && <Icon className='size-4' />}
                                <span className={cn("font-medium text-xs truncate", isMobile && "max-w-[8ch]")}>{project?.name}</span>
                            </section>
                        </PopoverTrigger>
                        <PopoverContent side='bottom' align='start'>
                            {
                                project && permission === EPermission.WRITE && <ProjectRenameForm
                                    defaultValues={{ projectName: project.name }}
                                    projectId={project.id}
                                    setIsOpen={setOpen}
                                />
                            }
                        </PopoverContent>
                    </Popover>

                    {
                        isMobile ? (
                            isSyncing ? <LoaderCircle className="animate-spin" size={16} /> : <CircleCheck size={16} />
                        ) : (
                            <Badge variant={'outline'}>
                                {
                                    isSyncing ?
                                        (<><LoaderCircle className="animate-spin" size={16} /> Syncing...</>)
                                        : (<><CircleCheck size={16} /> Synced</>)
                                }
                            </Badge>
                        )
                    }
                </div>

                <section className={cn(
                    isMobile
                        ? 'ml-auto'
                        : 'absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2'
                )}>
                    {
                        projectRunning ? (
                            <Button size="sm" variant="default" className="gap-1" type="button" onClick={onStop}>
                                <Pause size={16} />
                                Stop
                            </Button>
                        ) : (
                            <Button size="sm" variant="default" className="gap-1" type="button" onClick={onRun}>
                                <Play size={16} />
                                Run
                            </Button>
                        )
                    }
                </section>

                <div className="flex items-center gap-4">
                    <ActiveUsers />
                    <ShareBtn />
                    <ProfileDropdown />
                </div>
            </div>
        </section>
    )
}