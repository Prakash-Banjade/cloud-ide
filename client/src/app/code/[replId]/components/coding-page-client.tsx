"use client"

import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";
import { useAppMutation } from "@/hooks/useAppMutation";
import { API_URL, cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChevronRight, CircleCheck, LoaderCircle, Play } from "lucide-react";
import { TFileItem, FileTree, TreeItem } from "./file-tree";
import { TerminalComponent } from "./terminal";
import { fetchDirAsync, findItem, onItemSelect, updateTree } from "./file-manager-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "./editor/editor";
import { Badge } from "@/components/ui/badge";
import { useCodingEvents } from "@/context/coding-events-provider";

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

    return <CodingPagePostPodCreation />
}

export const CodingPagePostPodCreation = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); // used to get path
    const replId = params.replId ?? '';
    const { isSyncing } = useCodingEvents();

    const socket = useSocket("node-node"); // hardcoded for now

    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!socket) return

        socket.on('loaded', async ({ rootContent }) => {
            setLoaded(true)
            // first show whatever the server gave us at top-level
            let tree = rootContent
            setFileStructure(tree)

            const path = searchParams.get('path')
            if (!path) return

            // break “/a/b/c.txt” into ["a","b","c.txt"]
            const segments = path.split('/').filter(Boolean)
            let cumulative = ''

            // for each folder segment (all except the last)
            for (let i = 0; i < segments.length - 1; i++) {
                cumulative += '/' + segments[i]

                // do we already have that folder in our current tree?
                const folder = findItem(tree, cumulative)
                if (!folder || folder.type !== 'dir') break

                // if it has no children yet, fetch them
                if (!Array.isArray(folder.children)) {
                    const data = await fetchDirAsync(socket, cumulative)
                    tree = updateTree(tree, cumulative, data)
                }
                // if it already has children, just toggle expanded
                else {
                    tree = updateTree(tree, cumulative, null)
                }

                // update state so UI shows the expansion as we go
                setFileStructure(tree)
            }

            // now finally select the last segment (could be file or dir)
            const target = findItem(tree, path)
            if (target) {
                // if it’s a file, fetch its content & mark selected
                onItemSelect(target, setFileStructure, setSelectedFile, socket)
                // also push the same URL so router stays in sync
                if (target.type === 'file') {
                    router.replace(`/code/${replId}?path=${target.path}`)
                }
            }
        })
    }, [socket])

    const onSelect = (file: TreeItem) => {
        if (socket) {
            onItemSelect(file, setFileStructure, setSelectedFile, socket);
        }

        if (file.type === 'file') {
            router.push(`/code/${replId}?path=${file.path}`);
        }
    };

    if (!loaded) return "Loading...";

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
                <ResizablePanel
                    defaultSize={20}
                    minSize={15}
                    maxSize={30}
                    className="bg-sidebar"
                >
                    <div className="p-2 pl-4 text-sm font-medium uppercase">Explorer</div>
                    <FileTree files={fileStructure} onSelectFile={onSelect} selectedFile={selectedFile?.name ?? ""} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Code editor panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="px-2 py-1 text-sm bg-secondary">
                            <SelectedFileBreadCrumb selectedFile={selectedFile} />
                        </div>
                        <CodeEditor selectedFile={selectedFile} socket={socket} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Terminal and preview panel */}
                <ResizablePanel defaultSize={30} minSize={20}>
                    <Tabs defaultValue="terminal" className="h-full flex flex-col">
                        <TabsList className="mx-2 mt-1">
                            <TabsTrigger value="terminal">Terminal</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="terminal" className="flex-1 p-0 m-0">
                            <TerminalComponent socket={socket} />
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

function SelectedFileBreadCrumb({ selectedFile }: { selectedFile: TreeItem | undefined }) {
    if (!selectedFile || selectedFile.type === 'dir') return null;

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