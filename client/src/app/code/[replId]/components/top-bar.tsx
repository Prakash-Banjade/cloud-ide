import ProfileDropdown from '@/components/layout/profile-dropdown';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCodingStates } from '@/context/coding-states-provider';
import { languageFields } from '@/lib/utils';
import { CircleCheck, Home, LoaderCircle, Play } from 'lucide-react';
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

type Props = {
    socket: Socket
}

export default function TopBar({ socket }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { isSyncing, project, selectedFile } = useCodingStates();

    function onRun() {
        if (!socket || !project) return;

        socket.emit("process:run", { lang: project.language, path: selectedFile?.path }, (res: { error: string } | undefined) => {
            if (res?.error) toast.error(res.error);
        });
    }

    function onStop() {
        if (!socket) return;

        socket.emit("process:stop", (res: boolean) => {
            console.log(res)
        });
    }

    function checkPort() {
        if (!socket) return;

        const port = 3002;

        socket.emit("check-port", { port }, (data: any) => {
            console.log("port: ", port)
            console.log(data)
        })
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
                    <Button size="sm" variant="default" className="gap-1" type="button" onClick={onRun}>
                        <Play size={16} />
                        Run
                    </Button>
                    <Button size="sm" variant="default" className="gap-1" type="button" onClick={checkPort}>
                        <Play size={16} />
                        Check Port
                    </Button>
                    <Button size="sm" variant="default" className="gap-1" type="button" onClick={onStop}>
                        <Play size={16} />
                        Stop
                    </Button>
                </section>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <ProfileDropdown />
                </div>
            </div>
        </section>
    )
}