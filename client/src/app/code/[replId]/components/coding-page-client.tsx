"use client"

import { Button } from "@/components/ui/button";
import { useAppMutation } from "@/hooks/useAppMutation";
import { API_URL, cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChevronRight, CircleCheck, LoaderCircle, Play } from "lucide-react";
import { FileTree, TreeItem } from "./file-tree";
import { TerminalComponent } from "./terminal";
import { onItemSelect } from "../fns/file-manager-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "./editor/editor";
import { Badge } from "@/components/ui/badge";
import { CodingStatesProvider, useCodingStates } from "@/context/coding-states-provider";
import ExplorerActions from "./explorer-actions";
import { SocketProvider, useSocket } from "@/context/socket-provider";

export default function CodingPageClient() {
    const params = useParams();

    const { mutateAsync, isPending } = useAppMutation();

    useEffect(() => {
        const startResources = async () => {
            await mutateAsync({
                endpoint: `${API_URL}/projects/start`,
                method: 'post',
                data: { replId: params.replId }
            });
        }

        startResources();
    }, []);

    if (isPending) {
        return <div>Booting...</div>
    }

    return (
        <SocketProvider>
            <CodingStatesProvider>
                <CodingPagePostPodCreation />
            </CodingStatesProvider>
        </SocketProvider>
    )
}

export const CodingPagePostPodCreation = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); // used to get path
    const replId = params.replId ?? '';
    const { isSyncing, setSelectedItem, setFileStructure, setSelectedFile, refreshTree } = useCodingStates();

    const { socket } = useSocket();

    const [showOutput, setShowOutput] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('loaded', async ({ rootContent }: { rootContent: TreeItem[] }) => {
            setLoaded(true)
            await refreshTree(rootContent);
        })
    }, [socket])

    const onSelect = (file: TreeItem) => {
        if (socket) {
            onItemSelect(file, setFileStructure, setSelectedFile, setSelectedItem, socket);
        }

        if (file.type === 'file') {
            router.push(`/code/${replId}?path=${file.path}`);
        }
    };

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
                    <h1 className="font-semibold">{replId}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button size="sm" variant="default" className="gap-1">
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
                <ResizablePanel defaultSize={60} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="px-2 py-1 text-sm bg-secondary">
                            <SelectedFileBreadCrumb />
                        </div>
                        <CodeEditor socket={socket} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Terminal and preview panel */}
                <ResizablePanel defaultSize={20} minSize={20}>
                    <Tabs defaultValue="terminal" className="h-full flex flex-col">
                        <TabsList className="mx-2 mt-1">
                            <TabsTrigger value="terminal">Terminal</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="terminal" className="flex-1 p-0 m-0">
                            {/* <TerminalComponent socket={socket} /> */}
                        </TabsContent>
                        <TabsContent value="preview" className="flex-1 p-0 m-0">
                            {/* <Preview /> */}
                        </TabsContent>
                    </Tabs>
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