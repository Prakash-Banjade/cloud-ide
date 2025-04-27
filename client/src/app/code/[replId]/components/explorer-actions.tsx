import { TooltipWrapper } from '@/components/ui/tooltip'
import { useCodingStates } from '@/context/coding-states-provider'
import { CopyMinus, FilePlus2, FolderPlus, RotateCcw, File } from 'lucide-react'
import React, { useState } from 'react'
import { getParentFolder } from './file-manager-fns'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'

type Props = {}

export default function ExplorerActions({ }: Props) {
    const { selectedItem, fileStructure } = useCodingStates();
    const [isOpen, setIsOpen] = useState(false);
    const [newItemType, setNewItemType] = useState<'file' | 'dir'>('file');
    const [newItemName, setNewItemName] = useState('');

    const parentFolderPath = selectedItem && (selectedItem?.type === 'dir' ? selectedItem.path : getParentFolder(selectedItem, fileStructure).path);

    const handleNewItem = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedItem) return;

        console.log(parentFolderPath, newItemType, newItemName)
    }

    return (
        <section>
            <ResponsiveDialog
                title={newItemType === 'file' ? 'New file' : 'New folder'}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                description={parentFolderPath}
            >
                <form onSubmit={handleNewItem}>
                    <section className='relative flex items-center'>
                        <div className='absolute left-2'>
                            <File size={18} />
                        </div>
                        <Input
                            className='pl-8 w-full'
                            name="newItem"
                            placeholder={newItemType === 'file' ? 'filename.ext' : 'folder name'}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                        />
                    </section>
                </form>
            </ResponsiveDialog>

            <TooltipWrapper label="New file" contentProps={{ side: "bottom" }}>
                <button
                    type="button"
                    className="cursor-pointer hover:bg-secondary p-1 rounded-md"
                    onClick={() => {
                        setNewItemType('file');
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
                        setNewItemType('dir');
                        setIsOpen(true);
                    }}
                >
                    <FolderPlus size={16} />
                </button>
            </TooltipWrapper>

            <TooltipWrapper label="Refresh Explorer" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><RotateCcw size={16} /></button>
            </TooltipWrapper>

            <TooltipWrapper label="Collapse Folders in Explorer" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><CopyMinus size={16} /></button>
            </TooltipWrapper>
        </section>
    )
}