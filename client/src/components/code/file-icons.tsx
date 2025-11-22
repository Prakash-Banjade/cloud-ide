import { Icons } from "@/components/icons"
import { Braces, FileIcon, FileText, FileType, Folder, FolderOpen } from "lucide-react"

export const fileIcons = {
    js: <Icons.javascript className="size-4" />,
    ts: <Icons.typescript className="size-4" />,
    jsx: <Icons.javascript className="size-4" />,
    tsx: <Icons.tsx className="size-4" />,
    css: <Icons.css className="size-4" />,
    html: <Icons.html className="size-4" />,
    htm: <Icons.html className="size-4" />,
    c: <Icons.c className="size-4" />,
    cpp: <Icons.cpp className="size-4" />,
    json: <Braces className="size-4 dark:text-orange-400 text-orange-600" />,
    py: <Icons.python className="size-4" />,
    java: <Icons.java className="size-4" />,
    md: <FileText className="size-4 dark:text-gray-400 text-gray-600" />,
    txt: <FileType className="size-4 dark:text-gray-400 text-gray-600" />,
    default: <FileIcon className="size-4 dark:text-gray-400 text-gray-600" />,
    dirOpen: <FolderOpen className="size-4 dark:text-gray-400 text-gray-600" />,
    dirClosed: <Folder className="size-4 dark:text-gray-400 text-gray-600" />,
}

export const getFileIcon = (fileName: string) => {
    const lang = fileName.split('.').pop();
    return lang && fileIcons[lang as keyof typeof fileIcons] || fileIcons.default
}