"use client"

import { ChevronRight, ChevronDown, FileIcon, Folder, FolderOpen, FileCode, FileText, FileJson } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCodingStates } from "@/context/coding-states-provider"

// File type icons mapping
const fileIcons = {
    js: <FileCode className="h-4 w-4 text-yellow-400" />,
    jsx: <FileCode className="h-4 w-4 text-blue-400" />,
    tsx: <FileCode className="h-4 w-4 text-blue-500" />,
    css: <FileCode className="h-4 w-4 text-purple-400" />,
    html: <FileCode className="h-4 w-4 text-orange-400" />,
    json: <FileJson className="h-4 w-4 text-yellow-300" />,
    markdown: <FileText className="h-4 w-4 text-gray-400" />,
    plaintext: <FileText className="h-4 w-4 text-gray-400" />,
    default: <FileIcon className="h-4 w-4 text-gray-400" />,
}

export interface TFileItem {
    name: string
    type: "file"
    path: string
    content?: string
    language?: string
}

export interface TFolderItem {
    name: string
    type: "dir"
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
        return items.map((item) => {
            if (item.type === "dir") {
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

    return <div className="text-sm overflow-auto h-full">{renderFileTree(fileStructure)}</div>
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
                        if (child.type === "dir") {
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

    const getFileIcon = () => {
        return item.language && fileIcons[item.language as keyof typeof fileIcons] || fileIcons.default
    }

    return (
        <div
            className={cn("flex items-center py-1 hover:bg-sidebar-accent cursor-pointer", isSelected && "bg-sidebar-accent")}
            style={{ paddingLeft }}
            onClick={() => onSelectFile(item)}
        >
            <span className="mr-1 ml-5">{getFileIcon()}</span>
            <span className={cn(isSelected && "text-shadow-2xs")}>{item.name}</span>
        </div>
    )
}
