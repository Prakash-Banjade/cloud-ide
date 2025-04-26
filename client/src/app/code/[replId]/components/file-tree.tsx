"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, FileIcon, Folder, FolderOpen, FileCode, FileText, FileJson } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface FileItem {
    name: string
    type: "file"
    path: string
    content?: string
    language?: string
}

interface FolderItem {
    name: string
    type: "dir"
    path: string
    expanded?: boolean
    children: (FileItem | FolderItem)[]
}

export type TreeItem = (FileItem | FolderItem);

interface FileTreeProps {
    files: TreeItem[]
    onSelectFile: (treeItem: TreeItem) => void
    selectedFile: string
}

interface FolderItemProps {
    item: FolderItem
    level: number
    onSelectFile: (treeItem: TreeItem) => void
    selectedFile: string
}

interface FileItemProps {
    item: FileItem
    level: number
    onSelectFile: (treeItem: TreeItem) => void
    isSelected: boolean
}

export function FileTree({ files, onSelectFile, selectedFile }: FileTreeProps) {
    const renderFileTree = (items: (FileItem | FolderItem)[], level = 0) => {
        return items.map((item) => {
            if (item.type === "dir") {
                return (
                    <FolderItem
                        key={item.name}
                        item={item}
                        level={level}
                        onSelectFile={onSelectFile}
                        selectedFile={selectedFile}
                    />
                )
            } else {
                return (
                    <FileItem
                        key={item.name}
                        item={item}
                        level={level}
                        onSelectFile={onSelectFile}
                        isSelected={selectedFile === item.name}
                    />
                )
            }
        })
    }

    return <div className="text-sm overflow-auto h-full">{renderFileTree(files)}</div>
}

function FolderItem({ item, level, onSelectFile, selectedFile }: FolderItemProps) {
    const paddingLeft = `${level * 12 + 8}px`

    return (
        <div>
            <div
                className="flex items-center py-1 hover:bg-sidebar-accent cursor-pointer"
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
                                    selectedFile={selectedFile}
                                />
                            )
                        } else {
                            return (
                                <FileItem
                                    key={child.name}
                                    item={child}
                                    level={level + 1}
                                    onSelectFile={onSelectFile}
                                    isSelected={selectedFile === child.name}
                                />
                            )
                        }
                    })}
                </div>
            )}
        </div>
    )
}

function FileItem({ item, level, onSelectFile, isSelected }: FileItemProps) {
    const paddingLeft = `${level * 12 + 8}px`

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
            <span className={cn(isSelected && "font-medium")}>{item.name}</span>
        </div>
    )
}
