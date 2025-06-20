"use client"

import { TooltipWrapper } from '@/components/ui/tooltip'
import { useCodingStates } from '@/context/coding-states-provider'
import { CopyMinus, EllipsisVertical, FilePlus2, FolderPlus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { collapseAllDirs, getParentFolder, useRefreshTree } from '../fns/file-manager-fns'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useSocket } from '@/context/socket-provider'
import { EItemType, TreeItem } from './file-tree'
import { NewItemForm } from './item-form'
import { SocketEvents } from '@/lib/CONSTANTS'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ExplorerActions() {
    const { selectedItem, fileStructure, setFileStructure } = useCodingStates();
    const refreshTree = useRefreshTree();
    const [isOpen, setIsOpen] = useState(false);
    const [newItemType, setNewItemType] = useState<EItemType>(EItemType.FILE);
    const { socket } = useSocket();

    const parentFolderPath = selectedItem?.type === EItemType.DIR ? selectedItem.path : getParentFolder(selectedItem, fileStructure).path;

    const refresh = () => {
        if (!socket) return;

        socket.emit(SocketEvents.FETCH_DIR, '', (data: TreeItem[]) => {
            refreshTree({ content: data, socket });
        })
    }

    const collapse = () => {
        setFileStructure(prev => collapseAllDirs(prev));
    }

    return (
        <>
            <section className='@3xs:block hidden'>
                <ResponsiveDialog
                    title={newItemType === EItemType.FILE ? 'New file' : 'New folder'}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    description={`Location: ${parentFolderPath}`}
                >
                    <NewItemForm parentFolderPath={parentFolderPath} itemType={newItemType} setIsOpen={setIsOpen} />
                </ResponsiveDialog>

                <TooltipWrapper label="New file" contentProps={{ side: "bottom" }}>
                    <button
                        type="button"
                        className="cursor-pointer hover:bg-secondary p-1 rounded-md"
                        onClick={() => {
                            setNewItemType(EItemType.FILE);
                            setIsOpen(true);
                        }}
                    >
                        <FilePlus2 size={16} />
                    </button>
                </TooltipWrapper>

                <TooltipWrapper label="New folder" contentProps={{ side: "bottom" }}>
                    <button
                        type="button"
                        className="cursor-pointer hover:bg-secondary p-1 rounded-md"
                        onClick={() => {
                            setNewItemType(EItemType.DIR);
                            setIsOpen(true);
                        }}
                    >
                        <FolderPlus size={16} />
                    </button>
                </TooltipWrapper>

                <TooltipWrapper label="Refresh Explorer" contentProps={{ side: "bottom" }}>
                    <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md" onClick={refresh}>
                        <RotateCcw size={16} />
                    </button>
                </TooltipWrapper>

                <TooltipWrapper label="Collapse Folders in Explorer" contentProps={{ side: "bottom" }}>
                    <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md" onClick={collapse}>
                        <CopyMinus size={16} />
                    </button>
                </TooltipWrapper>
            </section>

            <DropdownMenu>
                <DropdownMenuTrigger asChild className='@3xs:hidden flex'>
                    <button type='button' className='cursor-pointer hover:bg-secondary p-1 rounded-sm'>
                        <EllipsisVertical size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='min-w-[200px]'>
                    <DropdownMenuLabel>Explorer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => {
                            setNewItemType(EItemType.FILE);
                            setIsOpen(true);
                        }}
                    >
                        <FilePlus2 size={16} />
                        New File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setNewItemType(EItemType.DIR);
                            setIsOpen(true);
                        }}
                    >
                        <FolderPlus size={16} />
                        New Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={refresh}>
                        <RotateCcw size={16} />
                        Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={collapse}>
                        <CopyMinus size={16} />
                        Collapse
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}