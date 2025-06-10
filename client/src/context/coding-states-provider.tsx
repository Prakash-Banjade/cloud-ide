"use client";

import { EItemType, TFileItem, TreeItem } from '@/app/code/[replId]/components/file-tree';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useAxiosPrivate } from '@/hooks/useAxios';
import { useQuery } from '@tanstack/react-query';
import { TProject } from '@/types';
import cookie from 'js-cookie';
import { z } from 'zod';
import { findItem } from '@/app/code/[replId]/fns/file-manager-fns';
import { useSocket } from './socket-provider';
import { useSession } from 'next-auth/react';
import CodingPageLoader from '@/app/code/[replId]/components/coding-page-loader';


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
    projectRunning: boolean;
    setProjectRunning: React.Dispatch<React.SetStateAction<boolean>>;
    mruFiles: TFileItem[];
    setMruFiles: React.Dispatch<React.SetStateAction<TFileItem[]>>;
    treeLoaded: boolean;
    setTreeLoaded: React.Dispatch<React.SetStateAction<boolean>>
}

export type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor


const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const params = useParams();
    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<TreeItem | undefined>(undefined);
    const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
    const [openedFiles, setOpenedFiles] = useState<TFileItem[]>([]);
    const [projectRunning, setProjectRunning] = useState(false);
    const [mruFiles, setMruFiles] = useState<TFileItem[]>([]);
    const [treeLoaded, setTreeLoaded] = useState(false);
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

    const [isSyncing, setIsSyncing] = useState(false);

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
        projectRunning,
        setProjectRunning,
        mruFiles,
        setMruFiles,
        treeLoaded,
        setTreeLoaded
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
                    setOpenedFiles(data.map(f => findItem(fileStructure, f)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (mruFiles) {
                const parsedData = JSON.parse(mruFiles);

                const { data, success } = z.array(z.string()).safeParse(parsedData);

                if (success) {
                    setMruFiles(data.map(f => findItem(fileStructure, f)).filter(f => !!f) as TFileItem[]);
                }
            }
            if (selectedFile) {
                const file = findItem(fileStructure, selectedFile);

                if (file && file.type === EItemType.FILE) {
                    socket?.emit("fetchContent", { path: file.path }, (data: string) => { // load data
                        file.content = data;
                    });
                    setSelectedFile(file);
                    setSelectedItem(file);
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

        // load the content if not loaded
        if (selectedFile.content === undefined) {
            socket?.emit("fetchContent", { path: selectedFile.path }, (data: string) => {
                selectedFile.content = data;
            });
        }

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
