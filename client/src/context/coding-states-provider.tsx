"use client";

import { useParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
    projectRunning: boolean;
    setProjectRunning: React.Dispatch<React.SetStateAction<boolean>>;
    mruFiles: TFileItem[];
    setMruFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    treeLoaded: boolean;
    setTreeLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    treePanelOpen: boolean;
    setTreePanelOpen: React.Dispatch<React.SetStateAction<boolean>>
    showTerm: boolean;
    setShowTerm: React.Dispatch<React.SetStateAction<boolean>>
}

export type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor


const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const params = useParams();
    const { data: session } = useSession();
    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<TreeItem | undefined>(undefined);
    const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
    const [treePanelOpen, setTreePanelOpen] = useState(false);
    const [openedFiles, setOpenedFiles] = useState<TFileItem[]>([]);
    const [projectRunning, setProjectRunning] = useState(false);
    const [mruFiles, setMruFiles] = useState<TFileItem[]>([]);
    const [treeLoaded, setTreeLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [permission, setPermission] = useState<EPermission>(EPermission.READ);
    const [showTerm, setShowTerm] = useState(() => permission === EPermission.WRITE && localStorage.getItem("showTerm") === "true");
    const axios = useAxiosPrivate();
    const { socket } = useSocket();
    const { status } = useSession();

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
            setPermission(isOwner ? EPermission.WRITE : (collaborator?.permission || EPermission.READ));
        }
    }, [data])

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
        projectRunning,
        setProjectRunning,
        mruFiles,
        setMruFiles,
        treeLoaded,
        setTreeLoaded,
        treePanelOpen,
        setTreePanelOpen,
        showTerm,
        setShowTerm
    };

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
                    setOpenedFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined, setFileStructure)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (mruFiles) {
                const parsedData = JSON.parse(mruFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setMruFiles(data.map(f => findItem(fileStructure, f, socket ?? undefined, setFileStructure)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (selectedFile) {
                const file = findItem(fileStructure, selectedFile, socket ?? undefined, setFileStructure);

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
