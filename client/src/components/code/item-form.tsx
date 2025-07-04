"use client"

import { z } from "zod"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/context/socket-provider"
import { Folder } from "lucide-react"
import { getFileIcon } from "./file-icons"
import { EItemType, TreeItem } from "./file-tree"
import { useCodingStates } from "@/context/coding-states-provider"
import { fileNameRgx } from "@/lib/utils"
import { SocketEvents } from "@/lib/CONSTANTS"
import { useState } from "react"
import { insertTreeItem } from "@/app/code/[replId]/fns/tree-mutation-fns"
import { findItem } from "@/app/code/[replId]/fns/file-manager-fns"

const newItemFormSchema = z.object({
    name: z.string().min(1, { message: "Name must be provided" }).max(50).regex(fileNameRgx, "Invalid file name. Cannot use illegal characters."),
    type: z.nativeEnum(EItemType),
});

interface NewItemFormProps {
    parentFolderPath: string,
    itemType: EItemType,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewItemForm({ parentFolderPath, itemType, setIsOpen }: NewItemFormProps) {
    const { fileStructure, setFileStructure, setSelectedFile, setSelectedItem, editorInstance, setMruFiles, setOpenedFiles } = useCodingStates();
    const { socket } = useSocket();
    const [error, setError] = useState<string | null>(null);
    const [itemName, setItemName] = useState<string>('');

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!parentFolderPath || !socket) return;

        const { success, data: values, error } = newItemFormSchema.safeParse({
            name: itemName,
            type: itemType
        });

        if (!success) {
            setError(error?.message);
            return;
        }

        const itemPath = (!!parentFolderPath && parentFolderPath !== "/") ? `${parentFolderPath}/${values.name}` : `/${values.name}`;

        const existing = findItem(fileStructure, itemPath);

        if (existing) {
            setError(`A file or folder ${values.name} already exists at this location. Please choose a different name.`);
            return;
        }

        socket.emit(SocketEvents.CREATE_ITEM, { path: itemPath, type: values.type }, ({ error, success }: { success: boolean, error: string | null }) => {
            if (success) {
                const newTreeItem: TreeItem = {
                    name: values.name,
                    path: itemPath,
                    type: values.type,
                    ...(values.type === EItemType.FILE ? {
                        language: values.name.split('.').pop(),
                        content: '',
                    } : {}),
                } as TreeItem;

                setFileStructure(prev => insertTreeItem(prev, newTreeItem)); // insert the new item in the tree
                setSelectedItem(newTreeItem);

                if (newTreeItem.type === EItemType.FILE) {
                    setSelectedFile(newTreeItem);
                    setOpenedFiles(prev => [...prev, newTreeItem]);
                    setMruFiles(prev => [newTreeItem, ...prev.filter(f => f.path !== newTreeItem.path)]); // place at the beginning
                    window.requestAnimationFrame(() => {
                        editorInstance?.focus();
                    })
                }

                setIsOpen(false);
            } else {
                setError(typeof error === 'string' ? error : `Cannot create ${itemType}`);
            }
        });
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <section className="space-y-2">
                <section className='relative flex items-center'>
                    <div className='absolute left-2'>
                        {
                            itemType === EItemType.FILE
                                ? getFileIcon(itemName)
                                : <Folder size={16} />
                        }
                    </div>
                    <Input
                        className='pl-8 w-full'
                        placeholder={itemType === EItemType.FILE ? 'filename.ext' : 'folder name'}
                        autoComplete="off"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                    />
                </section>
                {error && <p className="text-destructive text-sm">{error}</p>}
            </section>
        </form>
    )
}

