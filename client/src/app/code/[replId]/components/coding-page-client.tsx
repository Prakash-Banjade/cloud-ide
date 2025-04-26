"use client"

import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";
import { useAppMutation } from "@/hooks/useAppMutation";
import { cn, ORCHESTRATOR_URL } from "@/lib/utils";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ChevronRight, Play, Save } from "lucide-react";
import { FileTree, TreeItem } from "./file-tree";
import { TerminalComponent } from "./terminal";
import { onItemSelect } from "./file-manager-fns";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CodingPageClient() {
    const params = useParams();

    const { mutateAsync, isPending } = useAppMutation();

    useEffect(() => {
        const startResources = async () => {
            await mutateAsync({
                endpoint: `${ORCHESTRATOR_URL}/start`,
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
    const replId = params.replId ?? '';

    const socket = useSocket("node-node"); // hardcoded for now

    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TreeItem | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: TreeItem[] }) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
        }
    }, [socket]);

    const onSelect = (file: TreeItem) => {
        if (socket) {
            onItemSelect(file, setFileStructure, setSelectedFile, socket);
        }
    };

    if (!loaded) {
        return "Loading...";
    }

    if (!socket) return null;

    return (
        <div className="h-screen flex flex-col bg-secondary">
            {/* Top bar */}
            <div className="h-12 border-b-2 flex items-center px-4 bg-secondary">
                <div className="flex-1 flex items-center gap-2">
                    <span className="font-semibold">Qubide</span>
                    <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button size="sm" variant="ghost" className="gap-1">
                        <Save size={16} />
                        Save
                    </Button>
                    <Button size="sm" variant="default" className="gap-1">
                        <Play size={16} />
                        Run
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* File tree panel */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-sidebar">
                    <div className="p-2 text-sm font-medium uppercase">Explorer</div>
                    <FileTree files={fileStructure} onSelectFile={onSelect} selectedFile={selectedFile?.name ?? ""} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Code editor panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="px-2 py-1 text-sm bg-secondary">
                            <SelectedFileBreadCrumb selectedFile={selectedFile} />
                        </div>
                        {/* <CodeEditor code={code} language={selectedFile.split(".").pop()} onChange={setCode} /> */}
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