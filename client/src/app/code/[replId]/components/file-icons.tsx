import { Icons } from "@/components/icons"
import { FileIcon, FileText, FileJson } from "lucide-react"
import { TFileItem } from "./file-tree"

export const fileIcons = {
    js: <Icons.javascript className="size-4" />,
    ts: <Icons.typescript className="size-4" />,
    jsx: <Icons.javascript className="size-4" />,
    tsx: <Icons.tsx className="size-4" />,
    css: <Icons.css className="size-4" />,
    html: <Icons.html className="size-4" />,
    c: <Icons.c className="size-4" />,
    cpp: <Icons.cpp className="size-4" />,
    json: <FileJson className="h-4 w-4 text-yellow-300" />,
    markdown: <FileText className="h-4 w-4 text-gray-400" />,
    plaintext: <FileText className="h-4 w-4 text-gray-400" />,
    default: <FileIcon className="h-4 w-4 text-gray-400" />,
}


export const getFileIcon = (fileName: string) => {
    const lang = fileName.split('.').pop();
    return lang && fileIcons[lang as keyof typeof fileIcons] || fileIcons.default
}