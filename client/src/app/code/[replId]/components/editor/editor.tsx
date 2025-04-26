import Editor from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { TFileItem } from "../file-tree";
import { useTheme } from "next-themes";
import { useCodingEvents } from "@/context/coding-events-provider";

export const CodeEditor = ({ selectedFile, socket }: { selectedFile: TFileItem | undefined, socket: Socket }) => {
    const { theme } = useTheme();
    const { setIsSyncing } = useCodingEvents();

    if (!selectedFile) return null;

    return (
        <Editor
            height="100vh"
            language={getLanguageFromName(selectedFile.name)}
            value={selectedFile.content}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={debounce((value: string | undefined) => {
                if (value !== undefined) {
                    // TODO: Should send diffs, for now sending the whole file
                    setIsSyncing(true);
                    socket.emit("updateContent", { path: selectedFile.path, content: value }, (data: boolean) => {
                        setIsSyncing(false);
                    });
                }
            }, 1000)}
        />
    )
}

function debounce(func: (value: string | undefined) => void, wait: number) {
    let timeout: NodeJS.Timeout;

    return (value: string | undefined) => {
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