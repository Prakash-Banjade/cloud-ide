"use client"

import { Button } from "@/components/ui/button";
import { useAppMutation } from "@/hooks/useAppMutation";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { CircleCheck, LoaderCircle, Play, X } from "lucide-react";
import { FileTree, TFileItem, TreeItem } from "./file-tree";
import { onItemSelect } from "../fns/file-manager-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "./editor/editor";
import { Badge } from "@/components/ui/badge";
import { CodingStatesProvider, useCodingStates } from "@/context/coding-states-provider";
import ExplorerActions from "./explorer-actions";
import { SocketProvider, useSocket } from "@/context/socket-provider";
import { useSession } from "next-auth/react";
import FullPageLoader from "./full-page-loader";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getFileIcon } from "./file-icons";

const XTerminalNoSSR = dynamic(() => import("./terminal"), {
    ssr: false,
});

export default function CodingPageClient() {
    const params = useParams();
    const { status } = useSession()
    const [loaded, setLoaded] = useState(false);

    const { mutateAsync, isPending } = useAppMutation();

    useEffect(() => {
        const startResources = async () => {
            await mutateAsync({
                endpoint: `/projects/start`,
                method: 'post',
                data: { replId: params.replId }
            });
        }

        if (status === "authenticated") startResources();
    }, []);

    return (
        <SocketProvider>
            <CodingStatesProvider>
                <FullPageLoader isLoadingUser={status === 'loading'} isLoadingRepl={isPending} isLoaded={loaded} />
                <CodingPagePostPodCreation loaded={loaded} setLoaded={setLoaded} />
            </CodingStatesProvider>
        </SocketProvider>
    )
}

export const CodingPagePostPodCreation = ({ loaded, setLoaded }: { loaded: boolean, setLoaded: (loaded: boolean) => void }) => {
    const params = useParams();
    const router = useRouter();
    const replId = params.replId ?? '';
    const {
        isSyncing,
        setSelectedItem,
        setFileStructure,
        setSelectedFile,
        refreshTree,
        project,
        selectedFile,
        setOpenedFiles
    } = useCodingStates();

    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('loaded', async ({ rootContent }: { rootContent: TreeItem[] }) => {
            setLoaded(true)
            await refreshTree(rootContent);
        })

        return () => {
            socket.off('loaded');
        };
    }, [socket]);

    // useChokidar(socket);

    const onSelect = (file: TreeItem) => {
        if (socket) {
            onItemSelect(file, setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles, socket);
        }

        if (file.type === 'file') {
            router.push(`/code/${replId}?path=${file.path}`);
        }
    };

    function onRun() {
        if (!socket || !project) return;

        socket.emit("cmd-run", { lang: project.language, path: selectedFile?.path }, (res: { error: string } | undefined) => {
            if (res?.error) toast.error(res.error);
        });
    }

    if (!loaded) return "Loading your files...";

    if (!socket) return null;

    return (
        <div className="h-screen flex flex-col bg-secondary">
            {/* Top bar */}
            <div className="h-12 border-b-2 flex items-center justify-between px-4 bg-secondary">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Qubide</span>
                    <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>

                <div className="flex gap-2 items-center -ml-10">
                    <Badge variant={'outline'}>
                        {
                            isSyncing ?
                                (<><LoaderCircle className="animate-spin" size={16} /> Syncing...</>)
                                : (<><CircleCheck size={16} /> Synced</>)
                        }
                    </Badge>
                    <h1 className="font-semibold">{project?.name}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button size="sm" variant="default" className="gap-1" type="button" onClick={onRun}>
                        <Play size={16} />
                        Run
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* File tree panel */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={20} className="bg-sidebar">
                    <section className="p-2 pl-4 flex justify-between items-center gap-4">
                        <div className="text-sm font-medium uppercase">Explorer</div>
                        <div className="flex items-center gap-0.5 text-muted-foreground">
                            <ExplorerActions />
                        </div>
                    </section>
                    <FileTree onSelectFile={onSelect} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Code editor panel */}
                <ResizablePanel defaultSize={60} minSize={30}>
                    <div className="h-full flex flex-col">
                        <OpenedFilesTab />
                        <CodeEditor socket={socket} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Terminal and preview panel */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                    <ResizablePanelGroup direction="vertical" className="flex-1">
                        {
                            false && (
                                <>
                                    <ResizablePanel defaultSize={50} minSize={50}>
                                        <iframe width={"100%"} height={"100%"} src={`http://${replId}.qubide.cloud`} />
                                    </ResizablePanel>

                                    <ResizableHandle withHandle />
                                </>
                            )
                        }

                        <ResizablePanel defaultSize={100} minSize={30}>
                            <XTerminalNoSSR socket={socket} />
                        </ResizablePanel>

                    </ResizablePanelGroup>

                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

function OpenedFilesTab() {
    const { selectedFile, openedFiles, setOpenedFiles, setSelectedFile, setSelectedItem } = useCodingStates();
    // const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedTabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedTabRef.current) {
            // scroll only the inline axis (horizontal) so it moves left/right
            selectedTabRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",   // no vertical scroll change
                inline: "nearest",  // move horizontally just enough to see it
            });
        }
    }, [selectedFile]);

    function handleRemoveOpenedFile(file: TFileItem) {
        const newOpenedFiles = openedFiles.filter((f) => f.path !== file.path);
        setOpenedFiles(newOpenedFiles);

        if (file.path === selectedFile?.path) {
            selectFile(newOpenedFiles.at(-1));
        }
    }

    function selectFile(file: TFileItem | undefined) { // for file to be selected both has to be set
        setSelectedFile(file);
        setSelectedItem(file);
    }

    return (
        <div className="flex items-center gap-2">
            <ScrollArea
                // ref={scrollContainerRef}
                className="overflow-x-auto"
            >
                <div className="flex">
                    {
                        openedFiles.map((file) => {
                            const isSelected = file.path === selectedFile?.path;

                            return (
                                <div
                                    key={file.path}
                                    ref={isSelected ? selectedTabRef : null}
                                    role="button"
                                    className={cn("group flex items-center gap-2 cursor-pointer border-r p-2 pl-3", isSelected ? "bg-sidebar font-medium" : "border-b")}
                                    onClick={() => selectFile(file)}
                                >
                                    <span>
                                        {getFileIcon(file.name)}
                                    </span>

                                    <span className="truncate line-clamp-1 text-xs">
                                        {file.name}
                                    </span>

                                    <button
                                        type="button"
                                        className={cn("hover:bg-white/10 p-1 rounded-sm hover:cursor-pointer", !isSelected && "invisible group-hover:visible pointer-events-none group-hover:pointer-events-auto")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveOpenedFile(file)
                                        }}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )
                        })
                    }
                </div>
                <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
        </div>
    );
}