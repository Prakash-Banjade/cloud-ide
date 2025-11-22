"use client";

import { useParams } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAxiosPrivate } from '@/hooks/useAxios';
import { useQuery } from '@tanstack/react-query';
import { EPermission, TProject } from '@/types/types';
import { useSession } from 'next-auth/react';
import { TFileItem, TreeItem } from '@/types/tree.types';
import CodingPageLoader from '@/components/code/coding-page-loader';
import { RemoteUser } from '@/components/code/active-users';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { CodingStatesContextType, EPanel, IStandaloneCodeEditor } from './interface';
import { usePersistFilesState } from '@/features/usePersistFilesState';
import { useRemoteUsers } from '@/features/useRemoteUsers';

export const CodingStatesContext = createContext<CodingStatesContextType | undefined>(undefined);

interface CodingStatesProviderProps {
    children: ReactNode;
}

export function CodingStatesProvider({ children }: CodingStatesProviderProps) {
    const { replId } = useParams();
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

    const [showPanel, setShowPanel] = useState<Record<EPanel, boolean>>(() => ({
        aiChat: permission === EPermission.WRITE,
        fileTree: true,
        preview: false,
        terminal: permission === EPermission.WRITE,
    }));

    const termPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const previewPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const aiChatPanelRef = React.useRef<ImperativePanelHandle | null>(null);
    const treePanelRef = React.useRef<ImperativePanelHandle | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['project', replId],
        queryFn: async () => axios.get<TProject>(`/projects/${replId}`),
        enabled: status === 'authenticated',
        staleTime: Infinity,
        gcTime: Infinity
    });

    /**
     * Update permission based on project data and session
     */
    useEffect(() => {
        if (data) {
            const project = data.data;
            const [collaborator] = project.collaborators;
            const isOwner = project.createdBy.id === session?.user.userId;
            const permission = isOwner ? EPermission.WRITE : (collaborator?.permission || EPermission.READ);
            setPermission(permission);
        }
    }, [data])

    const togglePanel = (panel: EPanel, open: boolean) => {
        switch (panel) {
            case EPanel.Terminal: {
                open ? termPanelRef.current?.expand() : termPanelRef.current?.collapse();
                break;
            }
            case EPanel.AiChat: {
                open ? aiChatPanelRef.current?.expand() : aiChatPanelRef.current?.collapse();
                break;
            }
            case EPanel.Preview: {
                open ? previewPanelRef.current?.expand() : previewPanelRef.current?.collapse();
                break;
            }
            case EPanel.FileTree: {
                open ? treePanelRef.current?.expand() : treePanelRef.current?.collapse();
                break;
            }
        }

        setShowPanel(prev => ({
            ...prev,
            [panel]: open
        }));
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
