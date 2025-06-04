import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { EItemType, TreeItem } from "./file-tree"
import { Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/context/socket-provider"
import { ResponsiveAlertDialog } from "@/components/ui/responsive-alert-dialog"
import { useCodingStates } from "@/context/coding-states-provider"
import { updateTree } from "../fns/file-manager-fns"
import { removeItemFromTree } from "../fns/tree-mutation-fns"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { RenameItemForm } from "./rename-item-form"

type Props = {
    children: React.ReactNode,
    item: TreeItem
}

export function TreeItemContextMenu({ children, item }: Props) {
    const { setFileStructure } = useCodingStates();
    const [isOpen, setIsOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { socket } = useSocket();

    function handleDelete() {
        if (!socket) return;

        socket.emit('deleteItem', { path: item.path, type: item.type }, (data: boolean) => {
            // if (data) {
            //     setFileStructure(prev => removeItemFromTree(prev, item.path));
            // }
        });
    }

    return (
        <>
            {
                (item.type === EItemType.DIR) && (
                    <ResponsiveAlertDialog
                        isOpen={isAlertOpen}
                        setIsOpen={setIsAlertOpen}
                        title={`Delete ${item.path}?`}
                        description="This folder contains items inside it. Are you sure you want to delete it?"
                        action={handleDelete}
                        actionLabel="Delete"
                    />
                )
            }

            <ResponsiveDialog
                title={`Rename ${item.name}`}
                isOpen={isRenameOpen}
                setIsOpen={setIsRenameOpen}
            >
                <RenameItemForm item={item} setIsOpen={setIsRenameOpen} />
            </ResponsiveDialog>

            <ContextMenu onOpenChange={setIsOpen}>
                <ContextMenuTrigger>
                    <section
                        className={cn(isOpen && "outline")}
                        onContextMenu={e => {
                            if (item.type === EItemType.DIR && !Array.isArray(item.children)) { // fetch children if they don't exist, this is to show alert dialog based on children presence
                                socket?.emit("fetchDir", item.path, (data: TreeItem[]) => {
                                    setFileStructure(prev =>
                                        updateTree(prev, item.path, data, false)
                                    )
                                });
                            }
                        }}
                    >
                        {children}
                    </section>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setIsRenameOpen(true)}>
                        <Pencil />
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="text-destructive hover:!text-destructive"
                        onClick={(item.type === EItemType.DIR && item.children?.length) ? () => setIsAlertOpen(true) : handleDelete} // show alert only if item is dir and has children
                    >
                        <Trash className="text-destructive" />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>

    )
}