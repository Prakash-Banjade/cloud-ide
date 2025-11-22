
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { CircleX, Pencil, Trash, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getFileIcon } from "./file-icons";
import { useCodingStates } from "@/context/coding-states-provider";
import { TFileItem } from "@/types/tree.types";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { ResponsiveDialog } from "../ui/responsive-dialog";
import { RenameItemForm } from "./rename-item-form";
import { useDeleteTreeItem } from "./tree-item-actions";
import { useFileSystem } from "@/features/useFileSystem";

export default function OpenedFilesTab() {
    const { selectedFile, openedFiles, setOpenedFiles, setMruFiles, mruFiles } = useCodingStates();
    const selectedTabRef = useRef<HTMLDivElement>(null);
    const { handleFileSelect } = useFileSystem();

    useEffect(() => {
        if (selectedTabRef.current) {
            // scroll only the inline axis (horizontal) so it moves left/right
            selectedTabRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",   // no vertical scroll change
                inline: "nearest",  // move horizontally just enough to see it
            });
        }
    }, [selectedFile]);

    function handleRemoveOpenedFile(file: TFileItem) {
        setOpenedFiles(prev => prev.filter((f) => f.path !== file.path));

        const newMruFiles = mruFiles.filter((f) => f.path !== file.path);
        setMruFiles(newMruFiles);

        if (file.path === selectedFile?.path) {
            handleFileSelect(newMruFiles[0])
        }
    }

    return (
        <ScrollArea className="overflow-x-auto max-w-full">
            <div className="flex">
                {
                    openedFiles.map((file) => {
                        const isSelected = file.path === selectedFile?.path;

                        return (
                            <FileItemWithContextMenu key={file.path} file={file} handleRemoveOpenedFile={handleRemoveOpenedFile}>
                                <div
                                    key={file.path}
                                    ref={isSelected ? selectedTabRef : null}
                                    role="button"
                                    className={cn("group flex items-center gap-1 cursor-pointer p-2", isSelected && "dark:bg-[#1e1e1e] bg-white font-medium rounded-md")}
                                    style={{ boxShadow: isSelected ? "inset 0 1px brand" : "" }}
                                    onClick={() => handleFileSelect(file)}
                                >
                                    <span>
                                        {getFileIcon(file.name)}
                                    </span>

                                    <span className="max-w-[12ch] truncate text-xs">
                                        {file.name}
                                    </span>

                                    <button
                                        type="button"
                                        className={cn("hover:bg-white/10 p-1 rounded-sm hover:cursor-pointer", !isSelected && "invisible group-hover:visible pointer-events-none group-hover:pointer-events-auto")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveOpenedFile(file)
                                        }}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            </FileItemWithContextMenu>
                        )
                    })
                }
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
    );
}

function FileItemWithContextMenu({
    file,
    children,
    handleRemoveOpenedFile
}: {
    file: TFileItem,
    children: React.ReactNode,
    handleRemoveOpenedFile: (file: TFileItem) => void
}) {
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const { handleDelete } = useDeleteTreeItem();
    const { setOpenedFiles, setMruFiles, setSelectedFile } = useCodingStates();

    return (
        <>
            <ResponsiveDialog
                title={`Rename ${file.name}`}
                isOpen={isRenameOpen}
                setIsOpen={setIsRenameOpen}
            >
                <RenameItemForm item={file} setIsOpen={setIsRenameOpen} />
            </ResponsiveDialog>

            <ContextMenu>
                <ContextMenuTrigger asChild>
                    {children}
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem
                        className="text-xs"
                        onClick={() => setIsRenameOpen(true)}
                    >
                        <Pencil className="!size-3" />
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="text-destructive hover:!text-destructive text-xs"
                        onClick={() => handleDelete(file)}
                    >
                        <Trash className="!size-3 text-destructive" />
                        Delete
                    </ContextMenuItem>

                    <ContextMenuItem onClick={() => handleRemoveOpenedFile(file)} className="text-xs">
                        <X className="!size-3" />
                        Close {file.name}
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="text-xs"
                        onClick={() => {
                            setOpenedFiles([]);
                            setMruFiles([]);
                            setSelectedFile(undefined);
                        }}
                    >
                        <CircleX className="!size-3" />
                        Close All
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    )
} 