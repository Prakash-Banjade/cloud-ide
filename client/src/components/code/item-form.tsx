"use client"

import { z } from "zod"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/context/socket-provider"
import { Folder } from "lucide-react"
import { getFileIcon } from "./file-icons"
import { useCodingStates } from "@/context/coding-states-provider"
import { fileNameRgx } from "@/lib/utils"
import { SocketEvents } from "@/lib/CONSTANTS"
import { findItem } from "@/app/code/[replId]/fns/file-manager-fns"
import { EItemType, TreeItem } from "@/types/tree.types"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const newItemFormSchema = z.object({
    name: z.string().min(1, { message: "Name must be provided" }).max(50).regex(fileNameRgx, "Invalid file name. Cannot use illegal characters."),
    type: z.nativeEnum(EItemType),
});

interface NewItemFormProps {
    parentFolderPath: string,
    itemType: EItemType,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewItemForm({ parentFolderPath = "/", itemType, setIsOpen }: NewItemFormProps) {
    const { fileStructure, setSelectedFile, setSelectedItem, editorInstance, setMruFiles, setOpenedFiles } = useCodingStates();
    const { socket } = useSocket();

    const form = useForm({
        resolver: zodResolver(newItemFormSchema),
        defaultValues: {
            name: '',
            type: itemType
        }
    })

    const onSubmit = (values: z.infer<typeof newItemFormSchema>) => {
        if (!parentFolderPath || !socket) return;

        const itemPath = (!!parentFolderPath && parentFolderPath !== "/") ? `${parentFolderPath}/${values.name}` : `/${values.name}`;

        const existing = findItem(fileStructure, itemPath);

        if (existing) {
            form.setError("name", {
                message: `A file or folder ${values.name} already exists at this location. Please choose a different name.`,
                type: "custom",
            });
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
                form.setError("name", {
                    message: typeof error === 'string' ? error : `Cannot create ${itemType}`,
                    type: "custom",
                });
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <section className='relative flex items-center'>
                                    <div className='absolute left-2'>
                                        {
                                            itemType === EItemType.FILE
                                                ? getFileIcon(field.value)
                                                : <Folder size={16} />
                                        }
                                    </div>
                                    <Input
                                        className='pl-8 w-full'
                                        placeholder={itemType === EItemType.FILE ? 'filename.ext' : 'folder name'}
                                        autoComplete="off"
                                        required
                                        {...field}
                                    />
                                </section>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

