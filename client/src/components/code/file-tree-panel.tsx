import React from 'react'
import ExplorerActions from './explorer-actions'
import { TreeItem } from "@/types/tree.types"
import { useCodingStates } from '@/context/coding-states-provider';
import { Socket } from 'socket.io-client';
import { PanelLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { onItemSelect } from '@/app/code/[replId]/fns/file-manager-fns';
import { FileTree } from './file-tree';

type Props = {
    socket: Socket
}

export default function FileTreePanel({ socket }: Props) {
    const {
        setSelectedItem,
        setFileStructure,
        setSelectedFile,
        setOpenedFiles,
        setTreePanelOpen
    } = useCodingStates();

    const isMobile = useIsMobile();

    const onSelect = (file: TreeItem) => {
        if (!socket) return;
        onItemSelect(file, setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles, socket);
    };

    return (
        <section className="@container bg-sidebar h-full">
            <section className="p-2 pl-4 flex justify-between items-center gap-1">
                <section className='flex items-center gap-2'>
                    {
                        isMobile && (
                            <Button variant={'ghost'} size={'icon'} type="button" onClick={() => setTreePanelOpen(false)}>
                                <PanelLeftIcon size={16} />
                            </Button>
                        )
                    }
                    <div className="text-sm font-medium uppercase">
                        Explorer
                    </div>
                </section>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                    <ExplorerActions />
                </div>
            </section>
            <FileTree onSelectFile={onSelect} />
        </section>
    )
}