import ProfileDropdown from '@/components/layout/profile-dropdown';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCodingStates } from '@/context/coding-states-provider';
import { languageFields } from '@/lib/utils';
import { CircleCheck, Home, LoaderCircle, Pause, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Socket } from 'socket.io-client';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import ProjectRenameForm from '@/app/workspace/components/project-rename-form';
import { useState } from 'react';
import { EItemType, TreeItem } from './file-tree';
import { useRefreshTree } from '../fns/file-manager-fns';
import { SocketEvents } from '@/lib/CONSTANTS';

type Props = {
    socket: Socket
}

export default function TopBar({ socket }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { isSyncing, project, selectedFile, projectRunning, setProjectRunning, fileStructure } = useCodingStates();
    const refreshTree = useRefreshTree();

    function onRun() {
        if (!socket || !project) return;

        // for the first time, packages are being installed so we wait for node_modules to be created but it is not in the fileStructure, so we refresh the tree
        socket.emit(SocketEvents.FETCH_DIR, '', async (data: TreeItem[]) => {
            await refreshTree({ content: data, socket });
        });

        const hasDependeiciesNotInstalled = fileStructure.find(item => item.type === EItemType.FILE && item.name === "package.json") && !fileStructure.find(item => item.type === EItemType.DIR && item.name === "node_modules");

        if (hasDependeiciesNotInstalled) return toast.error("Please install dependencies before running the project.");

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
            <div className="relative border-b-2 flex items-center justify-between px-4 bg-card/70">
                <div className="flex items-center gap-2">
                    <Button
                        type='button'
                        onClick={() => router.push('/workspace')}
                        variant={'ghost'}
                        size={'icon'}
                        className='hover:!bg-secondary'
                    >
                        <Home />
                    </Button>

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger>
                            <section className='flex items-center gap-1 p-2 rounded-sm hover:bg-secondary'>
                                {Icon && <Icon className='size-4' />}
                                <span className="font-medium text-xs">{project?.name}</span>
                            </section>
                        </PopoverTrigger>
                        <PopoverContent side='bottom' align='start'>
                            {
                                project && <ProjectRenameForm
                                    defaultValues={{ projectName: project.name }}
                                    projectId={project.id}
                                    setIsOpen={setOpen}
                                />
                            }
                        </PopoverContent>
                    </Popover>

                    <Badge variant={'outline'}>
                        {
                            isSyncing ?
                                (<><LoaderCircle className="animate-spin" size={16} /> Syncing...</>)
                                : (<><CircleCheck size={16} /> Synced</>)
                        }
                    </Badge>
                </div>

                <section className='absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2'>
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

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <ProfileDropdown />
                </div>
            </div>
        </section>
    )
}