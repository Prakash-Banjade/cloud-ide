"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/context/socket-provider"
import { Folder } from "lucide-react"
import { getFileIcon } from "./file-icons"
import { EItemType, TreeItem } from "./file-tree"
import { insertTreeItem } from "../fns/tree-mutation-fns"
import { useCodingStates } from "@/context/coding-states-provider"
import { findItem } from "../fns/file-manager-fns"
import { fileNameRgx } from "@/lib/utils"
import { SocketEvents } from "@/lib/CONSTANTS"

const newItemFormSchema = z.object({
    name: z.string().min(1, { message: "Name must be provided" }).max(50).regex(fileNameRgx, "Invalid file name. Cannot use illegal characters."),
    type: z.nativeEnum(EItemType),
});

type NewItemFormType = z.infer<typeof newItemFormSchema>;

interface NewItemFormProps {
    parentFolderPath: string,
    itemType: EItemType,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewItemForm({ parentFolderPath, itemType, setIsOpen }: NewItemFormProps) {
    const { fileStructure, setFileStructure, setSelectedFile, setSelectedItem, editorInstance, setMruFiles, setOpenedFiles } = useCodingStates();
    const { socket } = useSocket();

    const form = useForm<NewItemFormType>({
        resolver: zodResolver(newItemFormSchema),
        defaultValues: {
            name: "",
            type: itemType ?? EItemType.FILE,
        },
    })

    const onSubmit = (values: NewItemFormType) => {
        if (!parentFolderPath || !socket) return;

        const itemPath = (!!parentFolderPath && parentFolderPath !== "/") ? `${parentFolderPath}/${values.name}` : `/${values.name}`;

        const existing = findItem(fileStructure, itemPath);

        if (existing) {
            form.setError("name", { message: `A file or folder ${values.name} already exists at this location. Please choose a different name.` });
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
                form.setError("name", { message: typeof error === 'string' ? error : `Cannot create ${itemType}` });
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
                                                ? getFileIcon(form.watch('name'))
                                                : <Folder size={16} />
                                        }
                                    </div>
                                    <Input
                                        className='pl-8 w-full'
                                        placeholder={itemType === EItemType.FILE ? 'filename.ext' : 'folder name'}
                                        autoComplete="off"
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

