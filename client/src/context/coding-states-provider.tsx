"use client";

import { fetchDirAsync, findItem, onItemSelect, updateTree } from '@/app/code/[replId]/fns/file-manager-fns';
import { TFileItem, TreeItem } from '@/app/code/[replId]/components/file-tree';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useSocket } from './socket-provider';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useAxiosPrivate } from '@/hooks/useAxios';
import { useQuery } from '@tanstack/react-query';
import { TProject } from '@/types';

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
    refreshTree: (content: TreeItem[]) => Promise<void>;
    editorInstance: IStandaloneCodeEditor | null,
    setEditorInstance: React.Dispatch<React.SetStateAction<IStandaloneCodeEditor | null>>
    project: TProject | undefined;
}

export type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor


const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const searchParams = useSearchParams();
    const params = useParams();
    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<TreeItem | undefined>(undefined);
    const [editorInstance, setEditorInstance] = useState<IStandaloneCodeEditor | null>(null);
    const [openedFiles, setOpenedFiles] = useState<TFileItem[]>([]);
    const { socket } = useSocket();
    const router = useRouter();
    const axios = useAxiosPrivate();

    const replId = params.replId;

    const { data } = useQuery({
        queryKey: ['project'],
        queryFn: async () => axios.get<TProject>(`/projects/${replId}`),
    });

    const [isSyncing, setIsSyncing] = useState(false);

    async function refreshTree(content: TreeItem[]) {
        if (!socket) return;

        // first show whatever the server gave us at top-level
        let tree = content;
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
            onItemSelect(target, setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles, socket)
            // also push the same URL so router stays in sync
            if (target.type === 'file') {
                router.replace(`/code/${replId}?path=${target.path}`)
            }
        }
    }

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
        refreshTree,
        editorInstance,
        setEditorInstance,
        project: data?.data
    };

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
