"use client"

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MoreHorizontal, X } from "lucide-react";
import { FileTree, TFileItem, TreeItem } from "./file-tree";
import { onFileSelect, onItemSelect, useRefreshTree } from "../fns/file-manager-fns";
import { CodeEditor } from "./editor";
import { CodingStatesProvider, useCodingStates } from "@/context/coding-states-provider";
import ExplorerActions from "./explorer-actions";
import { SocketProvider, useSocket } from "@/context/socket-provider";
import dynamic from "next/dynamic";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getFileIcon } from "./file-icons";
import TopBar from "./top-bar";
import { FileTabSwitcher } from "./tab-switcher";
import TermTopBar from "./term-top-bar";
import { previewLanguages, SocketEvents } from "@/lib/CONSTANTS";
import Preview from "./preview";
import CodingPageLoader from "./coding-page-loader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const XTerminalNoSSR = dynamic(() => import("./terminal"), {
    ssr: false,
});

export default function CodingPageClient() {
    return (
        <SocketProvider>
            <CodingStatesProvider>
                <CodingPagePostPodCreation />
            </CodingStatesProvider>
        </SocketProvider>
    )
}

export const CodingPagePostPodCreation = () => {
    const {
        setSelectedItem,
        setFileStructure,
        setSelectedFile,
        setOpenedFiles,
        setProjectRunning,
        projectRunning,
        project,
        treeLoaded,
        setTreeLoaded
    } = useCodingStates();
    const [showTerm, setShowTerm] = useState(() => localStorage.getItem("showTerm") === "true");

    const { socket } = useSocket();
    const refreshTree = useRefreshTree();

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.TREE_LOADED, async ({ rootContent }: { rootContent: TreeItem[] }) => {
            await refreshTree({
                content: rootContent,
                socket,
            });
            setTreeLoaded(true);
        });

        socket.on(SocketEvents.PROCESS_STATUS, (data: { isRunning: boolean }) => {
            setProjectRunning(data.isRunning || false);
        });

        return () => {
            socket.off(SocketEvents.TREE_LOADED);
            socket.off(SocketEvents.PROCESS_STATUS);
        };
    }, [socket]);

    // useChokidar(socket);

    const onSelect = (file: TreeItem) => {
        if (!socket) return;
        onItemSelect(file, setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles, socket);
    };

    const showPreview = project && projectRunning && previewLanguages.includes(project.language);

    if (!treeLoaded) return <CodingPageLoader state="loading_files" />;

    if (!socket) return null;

    return (
        <div className="h-screen flex flex-col bg-secondary">
            {/* Top bar */}
            <TopBar socket={socket} />
            <FileTabSwitcher />

            {/* Main content */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* File tree panel */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-sidebar">
                    <section className="p-2 pl-4 flex justify-between items-center gap-4">
                        <div className="text-sm font-medium uppercase">Explorer</div>
                        <div className="flex items-center gap-0.5 text-muted-foreground">
                            <ExplorerActions />
                        </div>
                    </section>
                    <FileTree onSelectFile={onSelect} />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={showPreview ? 50 : 80} minSize={40} className="relative">
                    <ResizablePanelGroup direction="vertical" className="flex-1">
                        {/* Code editor panel */}
                        <ResizablePanel defaultSize={70} minSize={30}>
                            <div className="h-full flex flex-col">
                                <OpenedFilesTab />
                                <CodeEditor socket={socket} />
                            </div>
                        </ResizablePanel>

                        {
                            showTerm && <ResizableHandle />
                        }

                        {/* Terminal panel */}
                        <TermTopBar setShowTerm={setShowTerm} showTerm={showTerm} />
                        <ResizablePanel defaultSize={30} minSize={showTerm ? 20 : 0} maxSize={showTerm ? 100 : 0} className={cn(!showTerm && "scale-y-0 origin-bottom")}>
                            <XTerminalNoSSR socket={socket} showTerm={showTerm} />
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </ResizablePanel>

                {
                    showPreview && (
                        <>
                            <ResizableHandle />

                            <ResizablePanel defaultSize={30} minSize={20}>
                                <Preview />
                            </ResizablePanel>

                        </>
                    )
                }
            </ResizablePanelGroup>
        </div>
    );
}

function OpenedFilesTab() {
    const { selectedFile, openedFiles, setOpenedFiles, setSelectedFile, setSelectedItem, setMruFiles, mruFiles } = useCodingStates();
    const selectedTabRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

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
        setOpenedFiles(prev => prev.filter((f) => f.path !== file.path));

        const newMruFiles = mruFiles.filter((f) => f.path !== file.path);
        setMruFiles(newMruFiles);

        if (file.path === selectedFile?.path) {
            selectFile(newMruFiles[0]);
        }
    }

    function selectFile(file: TFileItem | undefined) {
        if (!socket) return;

        if (file) {
            onFileSelect({ file, setSelectedFile, setSelectedItem, socket });
            setMruFiles(prev => [file, ...prev.filter(f => f.path !== file.path)]); // update MRU
            return;
        }

        setSelectedFile(file);
        setSelectedItem(file);
    }

    return (
        <div className="flex items-center gap-2">
            <ScrollArea className="overflow-x-auto max-w-[95%]">
                <div className="flex">
                    {
                        openedFiles.map((file) => {
                            const isSelected = file.path === selectedFile?.path;

                            return (
                                <div
                                    key={file.path}
                                    ref={isSelected ? selectedTabRef : null}
                                    role="button"
                                    className={cn("group flex items-center gap-2 cursor-pointer border-r p-2 pl-3", isSelected ? "dark:bg-[#1e1e1e] bg-white font-medium" : "border-b")}
                                    style={{ boxShadow: isSelected ? "inset 0 1px dodgerblue" : "" }}
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

            {
                openedFiles.length > 0 && (
                    <section className="ml-auto mr-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="p-1 rounded-sm hover:bg-white/10"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-[200px]">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setOpenedFiles([]);
                                        setMruFiles([]);
                                        setSelectedFile(undefined);
                                    }}
                                >
                                    Close All
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </section>
                )
            }
        </div>
    );
}