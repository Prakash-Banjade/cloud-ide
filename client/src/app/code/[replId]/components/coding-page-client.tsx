"use client"

import { Button } from "@/components/ui/button";
import { useAppMutation } from "@/hooks/useAppMutation";
import { cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChevronRight, CircleCheck, LoaderCircle, Play } from "lucide-react";
import { FileTree, TreeItem } from "./file-tree";
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
import useChokidar from "@/hooks/useChokidar";

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
    const searchParams = useSearchParams(); // used to get path
    const replId = params.replId ?? '';
    const { isSyncing, setSelectedItem, setFileStructure, setSelectedFile, refreshTree, project, selectedFile } = useCodingStates();

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

    useChokidar(socket);

    const onSelect = (file: TreeItem) => {
        if (socket) {
            onItemSelect(file, setFileStructure, setSelectedFile, setSelectedItem, socket);
        }

        if (file.type === 'file') {
            router.push(`/code/${replId}?path=${file.path}`);
        }
    };

    function onRun() {
        if (!socket || !project) return;

        socket.emit("cmd-run", { lang: project.language, path: selectedFile?.path }, (res: { error: string, success: boolean } | undefined) => {
            console.log(res)
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
                <ResizablePanel defaultSize={20} minSize={20} maxSize={30} className="bg-sidebar">
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
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="px-2 py-1 text-sm bg-secondary">
                            <SelectedFileBreadCrumb />
                        </div>
                        <CodeEditor socket={socket} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Terminal and preview panel */}
                <ResizablePanel defaultSize={30} minSize={20}>
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

function SelectedFileBreadCrumb() {
    const { selectedFile } = useCodingStates();

    if (!selectedFile) return null;

    const parts = selectedFile.path.split("/");
    parts.shift();

    return (
        <div className="flex items-center gap-2">
            <div className="text-sm font-medium flex items-center">
                {parts.map((part, index) => (
                    <div key={index} className="flex items-center">
                        <span className={cn(index < parts.length - 1 && "text-muted-foreground")}>{part}</span>
                        {index < parts.length - 1 && <span className="text-muted-foreground"><ChevronRight size={18} /></span>}
                    </div>
                ))}
            </div>
        </div>
    );
}