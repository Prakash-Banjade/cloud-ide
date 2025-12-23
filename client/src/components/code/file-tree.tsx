"use client"

import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCodingStates } from "@/context/coding-states-provider"
import { fileIcons, getFileIcon } from "./file-icons"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeItemContextMenu } from "./context-menu"
import { sortFolderFirst } from "@/app/code/[replId]/fns/file-manager-fns"
import { EItemType, TFileItem, TFolderItem, TreeItem } from "@/types/tree.types"
import { EPanel } from "@/context/coding-states-provider/interface"
import { useFileSystem } from "@/features/useFileSystem"

interface FolderItemProps {
    item: TFolderItem
    level: number
    onSelectDir: (dir: TFolderItem) => void
    onSelectFile: (file: TFileItem) => void
}

interface FileItemProps {
    item: TFileItem
    level: number
    onSelectFile: (file: TFileItem) => void
}

export function FileTree() {
    const { fileStructure, setSelectedItem } = useCodingStates();
    const { handleDirSelect, handleFileSelect } = useFileSystem();

    const renderFileTree = (items: (TFileItem | TFolderItem)[], level = 0) => {
        return sortFolderFirst(items).map((item) => {
            if (item.type === EItemType.DIR) {
                return (
                    <FolderItem
                        key={item.path}
                        item={item}
                        level={level}
                        onSelectDir={handleDirSelect}
                        onSelectFile={handleFileSelect}
                    />
                )
            } else {
                return (
                    <FileItem
                        key={item.path}
                        item={item}
                        level={level}
                        onSelectFile={handleFileSelect}
                    />
                )
            }
        })
    }

    return (
        <div className="file-tree text-sm overflow-hidden h-full">
            <ScrollArea className="h-[calc(100%-40px)]"> {/* 40px is the height of the EXPLORER section */}
                <section>
                    {renderFileTree(fileStructure)}
                </section>
                <TreeItemContextMenu
                    item={{
                        children: fileStructure,
                        name: "",
                        path: "",
                        type: EItemType.DIR,
                        expanded: true,
                    }}
                >
                    <div className="min-h-80 grow flex items-center justify-center" onClick={() => setSelectedItem(undefined)}>
                        {fileStructure.length === 0 && <span className="text-sm text-muted-foreground">No files found</span>}
                    </div>
                </TreeItemContextMenu>
            </ScrollArea>
        </div>
    );
}

function FolderItem({ item, level, onSelectDir, onSelectFile }: FolderItemProps) {
    const { selectedItem } = useCodingStates();
    const isSelected = item.path === selectedItem?.path;

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <div>
            <TreeItemContextMenu item={item}>
                <div
                    className={cn("flex items-center select-none py-1 px-2 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
                    style={{ paddingLeft }}
                    onClick={() => onSelectDir(item)}
                >
                    <span className="mr-1">
                        {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                    <span className="mr-1">
                        {item.expanded ? (
                            fileIcons.dirOpen
                        ) : (
                            fileIcons.dirClosed
                        )}
                    </span>
                    <span className="truncate">{item.name}</span>
                </div>
            </TreeItemContextMenu>
            {item.expanded && item.children && (
                <div>
                    {item.children.map((child) => {
                        if (child.type === EItemType.DIR) {
                            return (
                                <FolderItem
                                    key={child.path}
                                    item={child}
                                    level={level + 1}
                                    onSelectFile={onSelectFile}
                                    onSelectDir={onSelectDir}
                                />
                            )
                        } else {
                            return (
                                <FileItem
                                    key={child.path}
                                    item={child}
                                    level={level + 1}
                                    onSelectFile={onSelectFile}
                                />
                            )
                        }
                    })}
                </div>
            )}
        </div>
    )
}

function FileItem({ item, level, onSelectFile }: FileItemProps) {
    const { selectedFile, selectedItem, togglePanel } = useCodingStates();
    const isSelected = item.path === selectedFile?.path && item.path === selectedItem?.path; // for file to be selected, both path must match

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <TreeItemContextMenu item={item}>
            <div
                className={cn("select-none flex items-center py-1 px-2 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
                style={{ paddingLeft }}
                onClick={() => {
                    onSelectFile(item);
                    togglePanel(EPanel.FileTree, false); // close the tree panel on file selection
                }}
            >
                <span className="mr-1 ml-5">{getFileIcon(item.name)}</span>
                <span className={cn("truncate line-clamp-1", isSelected && "text-shadow-2xs")}>{item.name}</span>
            </div>
        </TreeItemContextMenu>
    )
}