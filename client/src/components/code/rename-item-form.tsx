"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/context/socket-provider"
import { Folder } from "lucide-react"
import { getFileIcon } from "./file-icons"
import { EItemType, TreeItem } from "@/types/tree.types"
import { useCodingStates } from "@/context/coding-states-provider"
import { fileNameRgx } from "@/lib/utils"
import { SocketEvents } from "@/lib/CONSTANTS"
import { findItem } from "@/app/code/[replId]/fns/file-manager-fns"
import { renameTreeItem } from "@/app/code/[replId]/fns/tree-mutation-fns"


interface RenameItemFormProps {
    parentFolderPath: string,
    item: TreeItem,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const renameformSchema = z.object({
    itemName: z.string().min(1, { message: "Name must be provided" }).max(50).regex(fileNameRgx, "Invalid file name. Cannot use illegal characters."),
});

type RenameItemFormValues = z.infer<typeof renameformSchema>;

export function RenameItemForm({ item, setIsOpen }: Omit<RenameItemFormProps, "parentFolderPath">) {
    const { fileStructure, setFileStructure, setSelectedFile, setSelectedItem, selectedFile, setMruFiles, setOpenedFiles } = useCodingStates();
    const { socket } = useSocket();

    const form = useForm<RenameItemFormValues>({
        resolver: zodResolver(renameformSchema),
        defaultValues: {
            itemName: item.name,
        },
    });

    const onSubmit = (values: RenameItemFormValues) => {
        if (!socket) return;

        const newPath = item.path.split('/').slice(0, -1).join('/') + `/${values.itemName}`;

        const existing = findItem(fileStructure, newPath);

        if (existing) {
            form.setError("itemName", { message: `A file or folder ${values.itemName} already exists at this location. Please choose a different name.` });
            return;
        }

        socket.emit(SocketEvents.RENAME_ITEM, { newPath, oldPath: item.path, type: item.type }, ({ error, success }: { success: boolean; error: string | null }) => {
            if (!success) {
                form.setError("itemName", {
                    message:
                        typeof error === "string"
                            ? error
                            : `Cannot rename ${item.name}`,
                });
                return;
            }

            const newTreeItem: TreeItem = {
                name: values.itemName,
                path: newPath,
                type: item.type,
                ...(item.type === EItemType.FILE
                    ? {
                        language: values.itemName.split(".").pop(),
                        content: item.content,
                    }
                    : {}),
            } as TreeItem;

            setFileStructure((prev) =>
                renameTreeItem(prev, item.path, newPath)
            );
            setSelectedItem(newTreeItem);

            // helper to rewrite paths under a renamed folder
            const rewritePath = (path: string) => {
                // exact match → use newTreeItem.path
                if (path === item.path) return newTreeItem.path;
                // child of renamed folder → swap prefix
                if (path.startsWith(item.path + "/")) {
                    return newTreeItem.path + path.slice(item.path.length);
                }
                // unaffected
                return path;
            };

            // update MRU
            setMruFiles((prev) =>
                prev.map((f) => ({
                    ...f,
                    path: rewritePath(f.path),
                }))
            );

            // update opened files
            setOpenedFiles((prev) =>
                prev.map((f) => ({
                    ...f,
                    path: rewritePath(f.path),
                }))
            );

            // if the selectedFile was somewhere under the renamed path, update it too
            if (selectedFile?.path.startsWith(item.path)) {
                setSelectedFile({
                    ...selectedFile,
                    path: rewritePath(selectedFile.path),
                });
            }

            setIsOpen(false);
        });

    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
                <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <section className='relative flex items-center'>
                                    <div className='absolute left-2'>
                                        {
                                            item.type === EItemType.FILE
                                                ? getFileIcon(form.watch('itemName'))
                                                : <Folder size={16} />
                                        }
                                    </div>
                                    <Input
                                        className='pl-8 w-full'
                                        placeholder={item.type === EItemType.FILE ? 'filename.ext' : 'folder name'}
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
