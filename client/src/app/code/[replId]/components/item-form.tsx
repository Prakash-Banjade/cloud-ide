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
import { insertTreeItem, renameTreeItem } from "../fns/tree-mutation-fns"
import { useCodingStates } from "@/context/coding-states-provider"
import { findItem } from "../fns/file-manager-fns"
import { Button } from "@/components/ui/button"

export const fileNameRgx = new RegExp(
    // 1) forbid reserved Windows device names (CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9)
    '^(?!^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$)' +
    // 2) allow an optional single leading dot (for dotfiles), but not multiple dots-only
    '(?!\\.+$)' +
    // 3) forbid leading or trailing space or dot (except that leading dot IS allowed by the previous line)
    '(?!.*[ .]$)' +
    // 4) actual name characters: anything except control, slash, backslash, or these: <>:"|?*
    '[^<>:"/\\\\|?*\\r\\n]+' +
    '$',
    'i'
);

const newItemFormSchema = z.object({
    itemName: z.string().min(1, { message: "Name must be provided" }).max(50).regex(fileNameRgx, "Invalid file name. Cannot use illegal characters."),
    type: z.nativeEnum(EItemType),
});

type NewItemFormType = z.infer<typeof newItemFormSchema>;

interface NewItemFormProps {
    parentFolderPath: string,
    itemType: EItemType,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewItemForm({ parentFolderPath, itemType, setIsOpen }: NewItemFormProps) {
    const { fileStructure, setFileStructure, setSelectedFile, setSelectedItem, editorInstance } = useCodingStates();
    const { socket } = useSocket();

    const form = useForm<NewItemFormType>({
        resolver: zodResolver(newItemFormSchema),
        defaultValues: {
            itemName: "",
            type: itemType || EItemType.FILE,
        },
    })

    const onSubmit = (values: NewItemFormType) => {
        if (!parentFolderPath || !socket) return;

        const itemPath = (!!parentFolderPath && parentFolderPath !== "/") ? `${parentFolderPath}/${values.itemName}` : `/${values.itemName}`;

        const existing = findItem(fileStructure, itemPath);

        if (existing) {
            form.setError("itemName", { message: `A file or folder ${values.itemName} already exists at this location. Please choose a different name.` });
            return;
        }

        socket.emit("createItem", { path: itemPath, type: values.type }, ({ error, success }: { success: boolean, error: string | null }) => {
            if (success) {
                const newTreeItem: TreeItem = {
                    name: values.itemName,
                    path: itemPath,
                    type: values.type,
                    ...(values.type === EItemType.FILE ? {
                        language: values.itemName.split('.').pop(),
                        content: '',
                    } : {}),
                } as TreeItem;

                setFileStructure(prev => insertTreeItem(prev, newTreeItem)); // insert the new item in the tree
                setSelectedItem(newTreeItem);

                if (newTreeItem.type === EItemType.FILE) {
                    setSelectedFile(newTreeItem);
                    window.requestAnimationFrame(() => {
                        editorInstance?.focus();
                    })
                }

                setIsOpen(false);
            } else {
                form.setError("itemName", { message: typeof error === 'string' ? error : `Cannot create ${itemType}` });
            }
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
                                            itemType === EItemType.FILE
                                                ? getFileIcon(form.watch('itemName'))
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
                <Button type="submit">Create</Button>
            </form>
        </Form>
    )
}

