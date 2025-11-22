import ProfileDropdown from '@/components/layout/profile-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCodingStates } from '@/context/coding-states-provider';
import { cn, languageFields } from '@/lib/utils';
import { BotIcon, CircleCheck, GlobeIcon, LoaderCircle, MoreHorizontal, PanelLeftIcon, Play, TerminalIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Socket } from 'socket.io-client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useState } from 'react';
import { longRunningLanguages, SocketEvents } from '@/lib/CONSTANTS';
import { useIsMobile } from '@/hooks/use-mobile';
import ProjectRenameForm from '../workspace/project-rename-form';
import ShareBtn from './share-popover';
import { EPermission } from '@/types/types';
import ActiveUsers from './active-users';
import OpenedFilesTab from './opened-files-tab';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EPanel } from '@/context/coding-states-provider/interface';

type Props = {
    socket: Socket
}

export default function TopBar({ socket }: Props) {
    const { isSyncing, project, showPanel, togglePanel, permission } = useCodingStates();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile(1000);

    const Icon = languageFields.find((field) => field.value === project?.language)?.icon || null;

    const hasWritePermission = permission === EPermission.WRITE;

    // key binding for terminal shortcut
    useEffect(() => {
        function handleTerminalShortcut(e: KeyboardEvent) {
            const key = e.key?.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === '`') {
                e.preventDefault();
                togglePanel(EPanel.Terminal, !showPanel.terminal);
            }
        }

        window.addEventListener("keydown", handleTerminalShortcut);

        return () => {
            window.removeEventListener("keydown", handleTerminalShortcut);
        }
    }, [togglePanel, showPanel.terminal]);

    if (!project) return null;

    return (
        <section className='bg-sidebar'>
            <div className="min-h-[50px] relative border-b flex items-center justify-between gap-2 px-4">
                <div className="flex items-center gap-2">
                    {
                        isMobile && (
                            <Button
                                type='button'
                                onClick={() => togglePanel(EPanel.FileTree, !showPanel.fileTree)}
                                variant={'ghost'}
                                size={'icon'}
                                className='hover:!bg-secondary'
                            >
                                <PanelLeftIcon />
                            </Button>
                        )
                    }

                    <Popover open={hasWritePermission && open} onOpenChange={setOpen}>
                        <PopoverTrigger>
                            <section className={cn(
                                'flex items-center gap-1 p-2 rounded-sm cursor-auto',
                                hasWritePermission && 'hover:bg-secondary cursor-pointer'
                            )}>
                                {Icon && <Icon className='size-4' />}
                                <span className={cn("font-medium text-xs truncate", isMobile && "max-w-[8ch]")}>{project?.name}</span>
                            </section>
                        </PopoverTrigger>
                        <PopoverContent side='bottom' align='start'>
                            {
                                project && hasWritePermission && <ProjectRenameForm
                                    defaultValues={{ projectName: project.name }}
                                    projectId={project.id}
                                    setIsOpen={setOpen}
                                />
                            }
                        </PopoverContent>
                    </Popover>

                    {
                        hasWritePermission && (
                            <>
                                {
                                    isMobile ? (
                                        isSyncing ? <LoaderCircle className="animate-spin" size={16} /> : <CircleCheck size={16} />
                                    ) : (
                                        <div className='w-[90px]'>
                                            <Badge variant={'outline'}>
                                                {
                                                    isSyncing ?
                                                        (<><LoaderCircle className="animate-spin" size={16} /> Syncing...</>)
                                                        : (<><CircleCheck size={16} /> Synced</>)
                                                }
                                            </Badge>
                                        </div>
                                    )
                                }
                            </>
                        )
                    }

                    {
                        !hasWritePermission && (
                            <Badge variant={'outline'}>
                                Read only
                            </Badge>
                        )
                    }

                    <RunBtn socket={socket} />
                </div>

                {
                    !isMobile && (
                        <div className='flex-1 max-w-[75%] mr-auto'>
                            <OpenedFilesTab />
                        </div>
                    )
                }


                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                            >
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {
                                hasWritePermission && (
                                    <>
                                        <DropdownMenuItem onClick={() => togglePanel(EPanel.Terminal, !showPanel.terminal)}>
                                            <TerminalIcon />
                                            {showPanel.terminal ? "Close" : "Open"} Terminal
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => togglePanel(EPanel.AiChat, !showPanel.aiChat)}>
                                            <BotIcon />
                                            {showPanel.aiChat ? "Close" : "Open"} AI Chat
                                        </DropdownMenuItem>
                                    </>
                                )
                            }
                            <DropdownMenuItem onClick={() => togglePanel(EPanel.Preview, !showPanel.preview)}>
                                <GlobeIcon />
                                {showPanel.preview ? "Close" : "Open"} Preview
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ActiveUsers />
                    <ShareBtn />
                    <div className='ml-1'>
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </section>
    )
}

function RunBtn({ socket }: { socket: Socket }) {
    const { permission, project, selectedFile, togglePanel } = useCodingStates();

    const hasWritePermission = permission === EPermission.WRITE;

    if (!hasWritePermission || !project || longRunningLanguages.includes(project?.language)) return null;

    function onRun() {
        if (!socket || !project) return;

        togglePanel(EPanel.Terminal, true); // need to show the terminal when running the project

        socket.emit(SocketEvents.PROCESS_RUN, { lang: project.language, path: selectedFile?.path }, (res: { error: string | null }) => {
            if (res?.error) toast.error(res.error);
        });
    }

    return (
        <Button size="icon" variant="ghost" type="button" onClick={onRun}>
            <Play size={16} />
        </Button>
    )
}