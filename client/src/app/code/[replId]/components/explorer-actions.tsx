import { TooltipWrapper } from '@/components/ui/tooltip'
import { useCodingStates } from '@/context/coding-states-provider'
import { CopyMinus, FilePlus2, FolderPlus, RotateCcw } from 'lucide-react'
import React, { useState } from 'react'
import { getParentFolder } from '../fns/file-manager-fns'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useSocket } from '@/context/socket-provider'
import { EItemType, TreeItem } from './file-tree'
import { NewItemForm } from './item-form'

export default function ExplorerActions() {
    const { selectedItem, fileStructure, refreshTree, setFileStructure } = useCodingStates();
    const [isOpen, setIsOpen] = useState(false);
    const [newItemType, setNewItemType] = useState<EItemType>(EItemType.FILE);
    const { socket } = useSocket();

    const parentFolderPath = selectedItem?.type === EItemType.DIR ? selectedItem.path : getParentFolder(selectedItem, fileStructure).path;

    const refresh = () => {
        if (!socket) return;

        socket.emit('fetchDir', '', (data: TreeItem[]) => {
            refreshTree(data);
        })
    }

    const collapse = () => {
        setFileStructure(prev => {
            return prev.map(item => {
                return item.type === EItemType.FILE
                    ? item
                    : { ...item, expanded: false }
            });
        })
    }

    return (
        <section>
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
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md" onClick={refresh}><RotateCcw size={16} /></button>
            </TooltipWrapper>

            <TooltipWrapper label="Collapse Folders in Explorer" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md" onClick={collapse}><CopyMinus size={16} /></button>
            </TooltipWrapper>
        </section>
    )
}