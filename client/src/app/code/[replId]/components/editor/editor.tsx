import Editor from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { useTheme } from "next-themes";
import { IStandaloneCodeEditor, useCodingStates } from "@/context/coding-states-provider";


export const CodeEditor = ({ socket }: { socket: Socket }) => {
    const { theme } = useTheme();
    const { setIsSyncing, selectedFile, setEditorInstance } = useCodingStates();

    function handleEditorDidMount(editor: IStandaloneCodeEditor) {
        setEditorInstance(editor);
        window.requestAnimationFrame(() => {
            editor.focus()
        });
    }

    if (!selectedFile) return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a file and start coding
        </div>
    );

    return (
        <Editor
            height="100vh"
            language={getLanguageFromName(selectedFile.name)}
            value={selectedFile.content}
            options={{
                "semanticHighlighting.enabled": true,
                acceptSuggestionOnEnter: "on",
                autoClosingBrackets: "always",
                autoClosingComments: "always",
            }}
            onMount={handleEditorDidMount}
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