"use client";

import { TFileItem, TreeItem } from '@/app/code/[replId]/components/file-tree';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode } from 'react';
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
    editorInstance: IStandaloneCodeEditor | null,
    setEditorInstance: React.Dispatch<React.SetStateAction<IStandaloneCodeEditor | null>>
    project: TProject | undefined;
    projectRunning: boolean;
    setProjectRunning: React.Dispatch<React.SetStateAction<boolean>>
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
    const axios = useAxiosPrivate();

    const replId = params.replId;

    const { data, error, isLoading } = useQuery({
        queryKey: ['project', replId],
        queryFn: async () => axios.get<TProject>(`/projects/${replId}`),
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
        setProjectRunning
    };

    if (isLoading) return <div>Loading project...</div>;

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
