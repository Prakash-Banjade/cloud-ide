"use client";

import { useParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useAxiosPrivate } from '@/hooks/useAxios';
import { useQuery } from '@tanstack/react-query';
import { EPermission, TProject } from '@/types/types';
import cookie from 'js-cookie';
import { z } from 'zod';
import { findItem } from '@/app/code/[replId]/fns/file-manager-fns';
import { useSocket } from './socket-provider';
import { useSession } from 'next-auth/react';
import { SocketEvents } from '@/lib/CONSTANTS';
import { EItemType, TFileItem, TreeItem } from '@/types/tree.types';
import CodingPageLoader from '@/components/code/coding-page-loader';
import { RemoteUser } from '@/components/code/active-users';
import { ImperativePanelHandle } from 'react-resizable-panels';

export enum EPanel {
    FileTree = "fileTree",
    Terminal = "terminal",
    Preview = "preview",
    AiChat = "aiChat"
}

interface CodingStatesContextType {
    fileStructure: TreeItem[];
    setFileStructure: React.Dispatch<React.SetStateAction<TreeItem[]>>;
    selectedFile: TFileItem | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<TFileItem | undefined>>;
    selectedItem: TreeItem | undefined;
    setSelectedItem: React.Dispatch<React.SetStateAction<TreeItem | undefined>>;
    openedFiles: TFileItem[];
    setOpenedFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    isSyncing: boolean;
    setIsSyncing: (value: boolean) => void;
    editorInstance: IStandaloneCodeEditor | null,
    setEditorInstance: React.Dispatch<React.SetStateAction<IStandaloneCodeEditor | null>>
    project: TProject | undefined;
    permission: EPermission;
    isOwner: boolean;
    mruFiles: TFileItem[];
    setMruFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    treeLoaded: boolean;
    setTreeLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    mutedUsers: string[];
    setMutedUsers: React.Dispatch<React.SetStateAction<string[]>>;
    observedUser: RemoteUser | null;
    setObservedUser: React.Dispatch<React.SetStateAction<RemoteUser | null>>
    objectsList: string[];
    setObjectsList: React.Dispatch<React.SetStateAction<string[]>>;
    showPanel: Record<EPanel, boolean>;
    togglePanel: (panel: EPanel, open?: boolean) => void
    observingPanelRef: React.RefObject<HTMLDivElement | null>;
    terminalPanelRef: React.RefObject<ImperativePanelHandle | null>;
    previewPanelRef: React.RefObject<ImperativePanelHandle | null>;
    aiChatPanelRef: React.RefObject<ImperativePanelHandle | null>;
    treePanelRef: React.RefObject<ImperativePanelHandle | null>;
}

export type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor


const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const params = useParams();
    const { data: session, status } = useSession();
    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<TreeItem | undefined>(undefined);
    const [permission, setPermission] = useState<EPermission>(EPermission.READ);
    const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
    const [openedFiles, setOpenedFiles] = useState<TFileItem[]>([]);
    const [mruFiles, setMruFiles] = useState<TFileItem[]>([]);
    const [treeLoaded, setTreeLoaded] = useState(false);
    const [objectsList, setObjectsList] = useState<string[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [mutedUsers, setMutedUsers] = useState<string[]>([]);
    const [observedUser, setObservedUser] = useState<RemoteUser | null>(null);
    const axios = useAxiosPrivate();
    const { socket } = useSocket();

    const [showPanel, setShowPanel] = useState<Record<EPanel, boolean>>(() => ({
        aiChat: permission === EPermission.WRITE && localStorage.getItem(`show:${EPanel.AiChat}`) === "true",
        fileTree: localStorage.getItem(`show:${EPanel.FileTree}`) === "true",
        preview: localStorage.getItem(`show:${EPanel.Preview}`) === "true",
        terminal: permission === EPermission.WRITE && localStorage.getItem(`show:${EPanel.Terminal}`) === "true",
    }));

    const termPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const previewPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const aiChatPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const treePanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const observingPanelRef = React.useRef<HTMLDivElement>(null);

    const replId = params.replId;

    const { data, isLoading } = useQuery({
        queryKey: ['project', replId],
        queryFn: async () => axios.get<TProject>(`/projects/${replId}`),
        enabled: status === 'authenticated',
        staleTime: Infinity,
        gcTime: Infinity
    });

    useEffect(() => {
        if (data) {
            const project = data.data;
            const [collaborator] = project.collaborators;
            const isOwner = project.createdBy.id === session?.user.userId;
            const permission = isOwner ? EPermission.WRITE : (collaborator?.permission || EPermission.READ);
            setPermission(permission);
            setShowPanel({
                aiChat: permission === EPermission.WRITE && localStorage.getItem(`show:${EPanel.AiChat}`) === "true",
                fileTree: localStorage.getItem(`show:${EPanel.FileTree}`) === "true",
                preview: localStorage.getItem(`show:${EPanel.Preview}`) === "true",
                terminal: permission === EPermission.WRITE && localStorage.getItem(`show:${EPanel.Terminal}`) === "true",
            });
        }
    }, [data])

    const togglePanel = (panel: EPanel, open?: boolean) => {
        setShowPanel(prev => {
            const panelOpen = typeof open === "boolean" ? open : !prev[panel];

            localStorage.setItem(`show:${panel}`, `${panelOpen}`);


            switch (panel) {
                case EPanel.Terminal: {
                    if (termPanelRef.current) {
                        termPanelRef.current.resize(panelOpen ? 30 : 0);
                    }
                    break;
                }
                case EPanel.AiChat: {
                    if (aiChatPanelRef.current) {
                        aiChatPanelRef.current.resize(panelOpen ? 30 : 0);
                    }
                    break;
                }
                case EPanel.Preview: {
                    if (previewPanelRef.current) {
                        previewPanelRef.current.resize(panelOpen ? 30 : 0);
                    }
                    break;
                }
                case EPanel.FileTree: {
                    if (treePanelRef.current) {
                        treePanelRef.current.resize(panelOpen ? 30 : 0);
                    }
                    break;
                }
            }

            return {
                ...prev,
                [panel]: panelOpen
            };
        });
    }

    useEffect(() => {
        termPanelRef.current?.resize(showPanel.terminal ? 30 : 0);
        previewPanelRef.current?.resize(showPanel.preview ? 30 : 0);
        aiChatPanelRef.current?.resize(showPanel.aiChat ? 30 : 0);
        treePanelRef.current?.resize(showPanel.fileTree ? 30 : 0);
    }, [showPanel]);

    useEffect(() => {
        if (!treeLoaded) return;

        const openedFiles = cookie.get(`openedFiles:${replId}`);
        const mruFiles = cookie.get(`mruFiles:${replId}`);
        const selectedFile = cookie.get(`selectedFile:${replId}`);

        try {
            if (openedFiles) {
                const parsedData = JSON.parse(openedFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setOpenedFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (mruFiles) {
                const parsedData = JSON.parse(mruFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setMruFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (selectedFile) {
                const file = findItem(fileStructure, selectedFile, socket ?? undefined);

                if (file && file.type === EItemType.FILE) {
                    socket?.emit(SocketEvents.FETCH_CONTENT, { path: file.path }, (data: string) => { // load data
                        file.content = data;
                        setSelectedFile(file);
                        setSelectedItem(file);
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }
    }, [treeLoaded])

    useEffect(() => {
        if (!treeLoaded) return;
        cookie.set(`openedFiles:${replId}`, JSON.stringify(openedFiles.map(f => f.path)), { expires: 7 });
    }, [openedFiles]);

    useEffect(() => {
        if (!treeLoaded) return;
        cookie.set(`mruFiles:${replId}`, JSON.stringify(mruFiles.map(f => f.path)), { expires: 7 });
    }, [mruFiles]);

    useEffect(() => {
        if (!selectedFile) return;
        cookie.set(`selectedFile:${replId}`, selectedFile?.path, { expires: 7 });
    }, [selectedFile]);

    const value = {
        fileStructure,
        setFileStructure,
        selectedFile,
        setSelectedFile,
        selectedItem,
        setSelectedItem,
        openedFiles,
        setOpenedFiles,
        isSyncing,
        setIsSyncing,
        editorInstance,
        setEditorInstance,
        project: data?.data,
        isOwner: data?.data.createdBy.id === session?.user.userId,
        permission,
        mruFiles,
        setMruFiles,
        treeLoaded,
        setTreeLoaded,
        mutedUsers,
        setMutedUsers,
        observedUser,
        setObservedUser,
        observingPanelRef,
        objectsList,
        setObjectsList,
        showPanel,
        togglePanel,
        terminalPanelRef: termPanelRef,
        previewPanelRef: previewPanelRef,
        aiChatPanelRef: aiChatPanelRef,
        treePanelRef: treePanelRef
    };

    if (isLoading || status === 'loading') return <CodingPageLoader state='loading_project' />;

    return (
        <CodingStatesContext.Provider value={value}>
            {children}
        </CodingStatesContext.Provider>
    );
}

export function useCodingStates() {
    const context = useContext(CodingStatesContext);
    if (context === undefined) {
        throw new Error('useCodingStates must be used within a CodingStatesProvider');
    }
    return context;
}
