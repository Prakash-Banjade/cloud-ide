"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/context/socket-provider"
import { Folder } from "lucide-react"
import { getFileIcon } from "./file-icons"
import { EItemType, TreeItem } from "./file-tree"

const fileNameRgx = new RegExp(
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

const formSchema = z.object({
    itemName: z.string().min(1, { message: "Name must be at least 1 character" }).max(50).regex(fileNameRgx, "Invalid file name"),
    type: z.nativeEnum(EItemType),
});


interface NewItemFormProps {
    parentFolderPath: string,
    itemType: EItemType,
    refresh: () => void,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewItemForm({ parentFolderPath, itemType, refresh, setIsOpen }: NewItemFormProps) {
    const { socket } = useSocket();

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            itemName: "",
            type: itemType || EItemType.FILE,
        },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!parentFolderPath || !socket) return;

        const itemPath = (!!parentFolderPath && parentFolderPath !== "/") ? `${parentFolderPath}/${values.itemName}` : `/${values.itemName}`;

        socket.emit("createItem", { path: itemPath, type: values.type }, ({ error, success }: { success: boolean, error: string | null }) => {
            if (success) {
                const newTreeItem: TreeItem = {
                    name: values.itemName,
                    path: itemPath,
                    language: values.itemName.split('.').pop(),
                    type: values.type,
                } as TreeItem;

                refresh(); // TODO: refreshing the whole tree is expensive
                setIsOpen(false);
            } else {
                form.setError("itemName", { message: typeof error === 'string' ? error : `Cannot create ${itemType}` });
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
