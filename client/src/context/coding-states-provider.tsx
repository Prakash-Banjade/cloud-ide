"use client";

import { TFileItem, TreeItem } from '@/app/code/[replId]/components/file-tree';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CodingStatesContextType {
    fileStructure: TreeItem[];
    setFileStructure: React.Dispatch<React.SetStateAction<TreeItem[]>>;
    selectedFile: TFileItem | undefined;
    setSelectedFile: React.Dispatch<React.SetStateAction<TFileItem | undefined>>;
    selectedItem: TreeItem | undefined;
    setSelectedItem: React.Dispatch<React.SetStateAction<TreeItem | undefined>>;
    isSyncing: boolean;
    setIsSyncing: (value: boolean) => void;
}

const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const [fileStructure, setFileStructure] = useState<TreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<TFileItem | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<TreeItem | undefined>(undefined);

    const [isSyncing, setIsSyncing] = useState(false);

    const value = {
        fileStructure,
        setFileStructure,
        selectedFile,
        setSelectedFile,
        selectedItem,
        setSelectedItem,
        isSyncing,
        setIsSyncing,
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
