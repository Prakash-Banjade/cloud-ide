"use client"

import { useEffect, useLayoutEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { CodeEditor } from "./editor/editor";
import { CodingStatesProvider, useCodingStates } from "@/context/coding-states-provider";
import { SocketProvider, useSocket } from "@/context/socket-provider";
import dynamic from "next/dynamic";
import TopBar from "./top-bar";
import { FileTabSwitcher } from "./tab-switcher";
import { SocketEvents } from "@/lib/CONSTANTS";
import Preview from "./preview";
import CodingPageLoader from "./coding-page-loader";
import FileTreePanel from "./file-tree-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRefreshTree } from "@/app/code/[replId]/fns/file-manager-fns";
import CodingClientFooter from "./editor/editor-footer";
import ReadOnlyTopBar from "./readonly-top-bar";
import useChokidar from "@/hooks/useChokidar";
import { TreeItem } from "@/types/tree.types";
import AIChatProvider, { AIChat } from "./ai-chat";
import { cn } from "@/lib/utils";
import { EPanel } from "@/context/coding-states-provider/interface";
import { usePersistFilesState } from "@/features/usePersistFilesState";
import { useRemoteUsers } from "@/features/useRemoteUsers";

const XTerminalNoSSR = dynamic(() => import("./terminal"), {
    ssr: false,
});

export default function CodingPageClient() {
    useLayoutEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [])

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
        treeLoaded,
        setTreeLoaded,
        setObjectsList,
        showPanel,
        togglePanel,
        terminalPanelRef,
        aiChatPanelRef,
        previewPanelRef,
        observedUser
    } = useCodingStates();
    const isMobile = useIsMobile(1000);

    const { socket, ptySocket } = useSocket();
    const refreshTree = useRefreshTree();

    useEffect(() => {
        if (!socket || !ptySocket) return;

        socket.on(SocketEvents.TREE_LOADED, async ({ rootContent, objectLists }: { rootContent: TreeItem[], objectLists: string[] }) => {
            setTreeLoaded(true);
            setObjectsList(objectLists);
            await refreshTree({
                content: rootContent,
                socket,
            });
        });

        return () => {
            socket.off(SocketEvents.TREE_LOADED);
        };
    }, [socket, ptySocket]);

    /**
     * Initialize features -->
     */
    useChokidar(); // initialize chokidar
    usePersistFilesState(); // Persist opened files, MRU files and selected file to cookies
    useRemoteUsers(); // Watch mode, syncing selected files, ...

    if (!treeLoaded) return <CodingPageLoader state="setup" />;

    if (!socket || !ptySocket) return null;

    return (
        <div className="h-screen overflow-hidden max-w-screen! flex flex-col bg-sidebar">
            {/* Top bar */}
            <ReadOnlyTopBar />
            <TopBar socket={ptySocket} />
            <FileTabSwitcher />

            {/* Main content */}
            <ResizablePanelGroup direction="horizontal" className="flex-1" autoSaveId={"main-content-panel-group"}>
                {/* File tree panel */}
                {
                    isMobile ? (
                        <Sheet open={showPanel.fileTree} onOpenChange={(val) => togglePanel(EPanel.FileTree, val)}>
                            <SheetContent
                                side="left"
                                aria-describedby="explorer-description"
                                className="[&>button]:hidden data-[state=open]:duration-150 data-[state=closed]:duration-150 w-screen max-w-[400px]"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                forceMount
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Explorer</SheetTitle>
                                </SheetHeader>
                                <FileTreePanel />
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <ResizablePanel
                            id="file-tree-panel"
                            order={1}
                            minSize={10}
                            maxSize={30}
                        >
                            <FileTreePanel />
                        </ResizablePanel>
                    )
                }

                <ResizableHandle />

                <ResizablePanel
                    id="editor-and-terminal-panel"
                    order={2}
                    className="relative"
                    minSize={40}
                >
                    <div className="h-full">
                        <ResizablePanelGroup direction="vertical" className="flex-1" autoSaveId={"editor-and-terminal-panel-group"}>
                            {/* Code editor panel */}
                            <ResizablePanel
                                id="code-editor-panel"
                                order={1}
                                defaultSize={70}
                                minSize={30}
                            >
                                <div className={cn("h-full flex flex-col relative")}>
                                    {observedUser && (
                                        <div className="absolute right-3 top-3 z-10 rounded-md bg-green-700 px-3 py-1 text-xs font-medium text-white shadow-sm">
                                            Watching {observedUser.name}
                                        </div>
                                    )}
                                    <CodeEditor socket={socket} />
                                </div>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Terminal panel */}
                            <ResizablePanel
                                id="terminal-panel"
                                order={2}
                                ref={terminalPanelRef}
                                defaultSize={30}
                                collapsible
                                minSize={10}
                                onCollapse={() => {
                                    togglePanel(EPanel.Terminal, false);
                                }}
                                onExpand={() => {
                                    togglePanel(EPanel.Terminal, true);
                                }}
                            >
                                <XTerminalNoSSR socket={ptySocket} />
                            </ResizablePanel>
                        </ResizablePanelGroup>

                    </div>
                </ResizablePanel>


                {/* AI Chat panel */}
                <AIChatProvider>
                    {
                        isMobile ? (
                            <Sheet open={showPanel.aiChat} onOpenChange={(val) => togglePanel(EPanel.AiChat, val)}>
                                <SheetContent
                                    side="right"
                                    aria-describedby="aiChat-description"
                                    className="[&>button]:hidden data-[state=open]:duration-150 data-[state=closed]:duration-150 w-screen max-w-[400px]"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    forceMount
                                >
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>AI Chat</SheetTitle>
                                    </SheetHeader>
                                    <AIChat />
                                </SheetContent>
                            </Sheet>
                        ) : (
                            <>
                                <ResizableHandle />
                                <ResizablePanel
                                    id="ai-chat-panel"
                                    order={3}
                                    defaultSize={30}
                                    ref={aiChatPanelRef}
                                    collapsible
                                    minSize={10}
                                    onCollapse={() => {
                                        togglePanel(EPanel.AiChat, false);
                                    }}
                                    onExpand={() => {
                                        togglePanel(EPanel.AiChat, true);
                                    }}
                                >
                                    <AIChat />
                                </ResizablePanel>
                            </>
                        )
                    }
                </AIChatProvider>

                {
                    isMobile ? (
                        <Sheet open={showPanel.preview} onOpenChange={(val) => togglePanel(EPanel.Preview, val)}>
                            <SheetContent
                                side="right"
                                aria-describedby="preview-description"
                                className="[&>button]:hidden data-[state=open]:duration-150 data-[state=closed]:duration-150 w-screen max-w-[400px]"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                forceMount
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Preview</SheetTitle>
                                </SheetHeader>
                                <Preview />
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <>
                            <ResizableHandle />
                            <ResizablePanel
                                id="preview-panel"
                                order={4}
                                ref={previewPanelRef}
                                defaultSize={30}
                                collapsible
                                minSize={10}
                                onCollapse={() => {
                                    togglePanel(EPanel.Preview, false);
                                }}
                                onExpand={() => {
                                    togglePanel(EPanel.Preview, true);
                                }}
                            >
                                <Preview />
                            </ResizablePanel>
                        </>
                    )
                }

            </ResizablePanelGroup>

            <CodingClientFooter />
        </div>
    );
}
