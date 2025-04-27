"use client"

import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCodingStates } from "@/context/coding-states-provider"
import { sortFolderFirst } from "./file-manager-fns"
import { getFileIcon } from "./file-icons"
import { ScrollArea } from "@/components/ui/scroll-area"

export enum EItemType {
    FILE = 'file',
    DIR = 'dir'
}


export interface TFileItem {
    name: string
    type: EItemType.FILE
    path: string
    content?: string
    language?: string
}

export interface TFolderItem {
    name: string
    type: EItemType.DIR
    path: string
    expanded?: boolean
    children: (TFileItem | TFolderItem)[]
}

export type TreeItem = (TFileItem | TFolderItem);

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
    const { fileStructure } = useCodingStates();

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

    return <div className="text-sm overflow-auto h-full">
        <ScrollArea className="h-full">
            {renderFileTree(fileStructure)}
            <div className="h-80"></div>
        </ScrollArea>
    </div>
}

function FolderItem({ item, level, onSelectFile }: FolderItemProps) {
    const { selectedItem } = useCodingStates();
    const isSelected = item.path === selectedItem?.path;

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <div>
            <div
                className={cn("flex items-center py-1 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
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
                <span>{item.name}</span>
            </div>
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
    const { selectedFile, selectedItem } = useCodingStates();
    const isSelected = item.path === selectedFile?.path && item.path === selectedItem?.path; // for file to be selected, both path must match

    const paddingLeft = `${level * 12 + 8}px`;

    return (
        <div
            className={cn("flex items-center py-1 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
            style={{ paddingLeft }}
            onClick={() => onSelectFile(item)}
        >
            <span className="mr-1 ml-5">{getFileIcon(item.name)}</span>
            <span className={cn(isSelected && "text-shadow-2xs")}>{item.name}</span>
        </div>
    )
}
