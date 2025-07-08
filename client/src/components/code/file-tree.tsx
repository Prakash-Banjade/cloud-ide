"use client"

import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCodingStates } from "@/context/coding-states-provider"
import { getFileIcon } from "./file-icons"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeItemContextMenu } from "./context-menu"
import { sortFolderFirst } from "@/app/code/[replId]/fns/file-manager-fns"
import { EItemType, TFileItem, TFolderItem, TreeItem } from "@/types/tree.types"
import useListenTreeMutation from "@/hooks/useListenTreeMutation"

interface FileTreeProps {
    onSelectFile: (treeItem: TreeItem) => void
}

interface FolderItemProps {
    item: TFolderItem
    level: number
    onSelectFile: (treeItem: TreeItem) => void
}

interface FileItemProps {
    item: TFileItem
    level: number
    onSelectFile: (treeItem: TreeItem) => void
}

export function FileTree({ onSelectFile }: FileTreeProps) {
    const { fileStructure, setSelectedItem } = useCodingStates();

    const renderFileTree = (items: (TFileItem | TFolderItem)[], level = 0) => {
        return sortFolderFirst(items).map((item) => {
            if (item.type === EItemType.DIR) {
                return (
                    <FolderItem
                        key={item.name}
                        item={item}
                        level={level}
                        onSelectFile={onSelectFile}
                    />
                )
            } else {
                return (
                    <FileItem
                        key={item.name}
                        item={item}
                        level={level}
                        onSelectFile={onSelectFile}
                    />
                )
            }
        })
    }

    // listen for tree mutations by other active users
    useListenTreeMutation();

    return (
        <div className="file-tree text-sm overflow-auto h-full">
            <ScrollArea className="h-full">
                <section>
                    {renderFileTree(fileStructure)}
                </section>
                <div className="min-h-80 grow" onClick={() => setSelectedItem(undefined)}></div>
            </ScrollArea>
        </div>
    );
}

function FolderItem({ item, level, onSelectFile }: FolderItemProps) {
    const { selectedItem } = useCodingStates();
    const isSelected = item.path === selectedItem?.path;

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <div>
            <TreeItemContextMenu item={item}>
                <div
                    className={cn("flex items-center select-none py-1 px-2 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
                    style={{ paddingLeft }}
                    onClick={() => onSelectFile(item)}
                >
                    <span className="mr-1">
                        {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                    <span className="mr-1">
                        {item.expanded ? (
                            <FolderOpen className="h-4 w-4 text-yellow-400" />
                        ) : (
                            <Folder className="h-4 w-4 text-yellow-400" />
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
                                    key={child.name}
                                    item={child}
                                    level={level + 1}
                                    onSelectFile={onSelectFile}
                                />
                            )
                        } else {
                            return (
                                <FileItem
                                    key={child.name}
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
    const { selectedFile, selectedItem, setMruFiles, setTreePanelOpen } = useCodingStates();
    const isSelected = item.path === selectedFile?.path && item.path === selectedItem?.path; // for file to be selected, both path must match

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <TreeItemContextMenu item={item}>
            <div
                className={cn("select-none flex items-center py-1 px-2 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
                style={{ paddingLeft }}
                onClick={() => {
                    onSelectFile(item);
                    setMruFiles(prev => [item, ...prev.filter(f => f.path !== item.path)]); // place at the beginning
                    setTreePanelOpen(false); // close the tree panel on file selection
                }}
            >
                <span className="mr-1 ml-5">{getFileIcon(item.name)}</span>
                <span className={cn("truncate line-clamp-1", isSelected && "text-shadow-2xs")}>{item.name}</span>
            </div>
        </TreeItemContextMenu>
    )
}
