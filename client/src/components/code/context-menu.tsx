import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { EItemType, TreeItem } from "@/types/tree.types"
import { ChangeEvent, useState } from "react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/context/socket-provider"
import { ResponsiveAlertDialog } from "@/components/ui/responsive-alert-dialog"
import { useCodingStates } from "@/context/coding-states-provider"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { RenameItemForm } from "./rename-item-form"
import { SocketEvents } from "@/lib/CONSTANTS"
import { NewItemForm } from "./item-form"
import { updateTree } from "@/app/code/[replId]/fns/file-manager-fns"
import { EPermission } from "@/types/types"
import { useDeleteTreeItem } from "@/hooks/useListenTreeMutation"
import useUpload from "@/hooks/useUpload"
import toast from "react-hot-toast"

type Props = {
    children: React.ReactNode,
    item: TreeItem
}

export function TreeItemContextMenu({ children, item }: Props) {
    const { setFileStructure, setOpenedFiles, setMruFiles, setSelectedFile, mruFiles, permission } = useCodingStates();
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { socket } = useSocket();
    const [isNewItemOpen, setIsNewItemOpen] = useState(false);
    const [newItemType, setNewItemtype] = useState<EItemType>(EItemType.FILE);
    const { deleteItem } = useDeleteTreeItem();
    const { upload } = useUpload();

    function handleDelete() {
        if (!socket) return;

        socket.emit(SocketEvents.DELETE_ITEM, { path: item.path, type: item.type }, (data: boolean) => {
            if (data) {
                deleteItem({ path: item.path, type: item.type });
            }
        });
    }

    const handleUpload = (e: ChangeEvent<HTMLInputElement>, type: EItemType) => {
        try {
            upload(e, { type, path: item.path });
        } catch (e) {
            if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        }
    }

    return (
        <>
            {
                (item.type === EItemType.DIR) && (
                    <>
                        <ResponsiveAlertDialog
                            isOpen={permission === EPermission.WRITE && isAlertOpen}
                            setIsOpen={setIsAlertOpen}
                            title={`Delete ${item.path}?`}
                            description="This folder contains items inside it. Are you sure you want to delete it?"
                            action={handleDelete}
                            actionLabel="Delete"
                        />
                        <ResponsiveDialog
                            title={newItemType === EItemType.FILE ? 'New file' : 'New folder'}
                            isOpen={permission === EPermission.WRITE && isNewItemOpen}
                            setIsOpen={setIsNewItemOpen}
                            description={`Location: ${item.path}`}
                        >
                            <NewItemForm parentFolderPath={item.path} itemType={newItemType} setIsOpen={setIsNewItemOpen} />
                        </ResponsiveDialog>
                        <input
                            id={"files-upload" + item.path}
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={e => handleUpload(e, EItemType.FILE)}
                        />
                        <input
                            id={"dir-upload" + item.path}
                            type="file"
                            multiple
                            className="sr-only"
                            // @ts-expect-error
                            webkitdirectory=""
                            directory=""
                            onChange={e => handleUpload(e, EItemType.DIR)}
                        />
                    </>
                )
            }

            <ResponsiveDialog
                title={`Rename ${item.name}`}
                isOpen={isRenameOpen}
                setIsOpen={setIsRenameOpen}
            >
                <RenameItemForm item={item} setIsOpen={setIsRenameOpen} />
            </ResponsiveDialog>

            <ContextMenu onOpenChange={setIsContextMenuOpen}>
                <ContextMenuTrigger disabled={permission !== EPermission.WRITE}>
                    <section
                        className={cn(isContextMenuOpen && "outline")}
                        onContextMenu={() => {
                            if (permission !== EPermission.WRITE) return;

                            if (item.type === EItemType.DIR && !Array.isArray(item.children)) { // fetch children if they don't exist, this is to show alert dialog based on children presence
                                socket?.emit(SocketEvents.FETCH_DIR, item.path, (data: TreeItem[]) => {
                                    setFileStructure(prev =>
                                        updateTree(prev, item.path, data)
                                    )
                                });
                            }
                        }}
                    >
                        {children}
                    </section>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {
                        item.type === EItemType.DIR && (
                            <>
                                <ContextMenuItem
                                    className="px-4 pr-20"
                                    onClick={() => {
                                        setNewItemtype(EItemType.FILE)
                                        setIsNewItemOpen(true)
                                    }}
                                >
                                    New File...
                                </ContextMenuItem>
                                <ContextMenuItem
                                    className="px-4"
                                    onClick={() => {
                                        setNewItemtype(EItemType.DIR)
                                        setIsNewItemOpen(true)
                                    }}
                                >
                                    New Folder...
                                </ContextMenuItem>
                                <ContextMenuItem
                                    className="px-4"
                                    onClick={() => { }}
                                    asChild
                                >
                                    <label htmlFor={"files-upload" + item.path}>Upload Files</label>
                                </ContextMenuItem>
                                <ContextMenuItem
                                    className="px-4"
                                    onClick={() => { }}
                                    asChild
                                >
                                    <label htmlFor={"dir-upload" + item.path}>Upload Folder</label>
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                            </>
                        )
                    }
                    <ContextMenuItem
                        className="px-4"
                        onClick={() => setIsRenameOpen(true)}
                    >
                        {/* <Pencil /> */}
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="text-destructive hover:!text-destructive px-4"
                        onClick={(item.type === EItemType.DIR && item.children?.length) ? () => setIsAlertOpen(true) : handleDelete} // show alert only if item is dir and has children
                    >
                        {/* <Trash className="text-destructive" /> */}
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>

    )
}