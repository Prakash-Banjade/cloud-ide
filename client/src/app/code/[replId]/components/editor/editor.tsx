import Editor from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { FileItem } from "../file-tree";

export const CodeEditor = ({ selectedFile, socket }: { selectedFile: FileItem | undefined, socket: Socket }) => {
    if (!selectedFile) return null

    return (
        <Editor
            height="100vh"
            language={getLanguageFromName(selectedFile.name)}
            value={selectedFile.content}
            theme="vs-dark"
            onChange={value => debounce((value) => {
                // TODO: Should send diffs, for now sending the whole file
                socket.emit("updateContent", { path: selectedFile.path, content: value });
            }, 1000)}
        />
    )
}

function debounce(func: (value: string) => void, wait: number) {
    let timeout: NodeJS.Timeout;

    return (value: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(value);
        }, wait);
    };
}

const langObj = {
    "js": "javascript",
    "jsx": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "py": "python",
    "html": "html",
    "htm": "html",
    "css": "css",
    "json": "json",
    "md": "markdown",
    "c": "c",
    "cpp": "cpp",
    "c++": "cpp"
}

function getLanguageFromName(name: string) {
    let ext = name.split('.').pop();

    return langObj?.[ext as keyof typeof langObj] || "plaintext";
}