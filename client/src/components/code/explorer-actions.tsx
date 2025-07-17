"use client"

import { useCodingStates } from '@/context/coding-states-provider'
import { CopyMinus, Download, EllipsisVertical, FilePlus2, FileUp, FolderPlus, FolderUp, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useSocket } from '@/context/socket-provider'
import { EItemType, TreeItem } from "@/types/tree.types"
import { NewItemForm } from './item-form'
import { SocketEvents } from '@/lib/CONSTANTS'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { collapseAllDirs, getParentFolder, useRefreshTree } from '@/app/code/[replId]/fns/file-manager-fns'
import { EPermission } from '@/types/types'
import useDownload from '@/hooks/useDownload'
import useUpload from '@/hooks/useUpload'

export default function ExplorerActions() {
    const { selectedItem, fileStructure, setFileStructure, permission } = useCodingStates();
    const refreshTree = useRefreshTree();
    const [isOpen, setIsOpen] = useState(false);
    const [newItemType, setNewItemType] = useState<EItemType>(EItemType.FILE);
    const { socket } = useSocket();
    const handleDownload = useDownload();
    const { upload } = useUpload();

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
            {
                permission === EPermission.WRITE && (
                    <>
                        <ResponsiveDialog
                            title={newItemType === EItemType.FILE ? 'New file' : 'New folder'}
                            isOpen={isOpen}
                            setIsOpen={setIsOpen}
                            description={`Location: ${parentFolderPath}`}
                        >
                            <NewItemForm parentFolderPath={parentFolderPath} itemType={newItemType} setIsOpen={setIsOpen} />
                        </ResponsiveDialog>

                        <input
                            id={"files-upload /"} // / is the root path
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={e => upload(e, { type: EItemType.FILE, path: "/" })}
                        />
                        <input
                            id={"dir-upload /"}
                            type="file"
                            multiple
                            className="sr-only"
                            // @ts-expect-error
                            webkitdirectory=""
                            directory=""
                            onChange={e => upload(e, { type: EItemType.DIR, path: "/" })}
                        />
                    </>
                )
            }

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type='button' className='cursor-pointer hover:bg-secondary p-1 rounded-sm'>
                        <EllipsisVertical size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='min-w-[200px]'>
                    <DropdownMenuLabel>Explorer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {
                        permission === EPermission.WRITE && (
                            <>
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => { }}
                                    asChild
                                >
                                    <label htmlFor={"files-upload /"}>
                                        <FileUp />
                                        Upload Files
                                    </label>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => { }}
                                    asChild
                                >
                                    <label htmlFor={"dir-upload /"}>
                                        <FolderUp />
                                        Upload Folder
                                    </label>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )
                    }

                    <DropdownMenuItem onClick={refresh}>
                        <RotateCcw size={16} />
                        Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={collapse}>
                        <CopyMinus size={16} />
                        Collapse
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                        <Download /> Download
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}