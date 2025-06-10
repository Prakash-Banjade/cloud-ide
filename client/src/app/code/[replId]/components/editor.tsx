import Editor, { Monaco } from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { useTheme } from "next-themes";
import { IStandaloneCodeEditor, useCodingStates } from "@/context/coding-states-provider";
import { useEffect } from "react";

export const CodeEditor = ({ socket }: { socket: Socket }) => {
    const { theme } = useTheme();
    const { setIsSyncing, selectedFile, setEditorInstance } = useCodingStates();

    async function handleEditorDidMount(editor: IStandaloneCodeEditor, monaco: Monaco) {
        setEditorInstance(editor);
        window.requestAnimationFrame(() => {
            editor.focus()
        });

        if (selectedFile && getLanguageFromName(selectedFile.name) === 'typescript') {
            const modelUri = monaco.Uri.file(selectedFile.name ?? "");


            const codeModel = monaco.editor.createModel(
                selectedFile.content ?? "",
                "typescript",
                modelUri
            );

            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                jsx: "react" as any
            });

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false
            })

            editor.setModel(codeModel);
        }
    }

    const syncFileContent = debounce((value: string | undefined) => {
        if (value !== undefined && selectedFile) {
            // TODO: Should send diffs, for now sending the whole file
            setIsSyncing(true);
            socket.emit("updateContent", { path: selectedFile.path, content: value }, (data: boolean) => {
                setIsSyncing(false);
            });
        }
    }, 1000);

    // Sync file content on ctrl+s
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === 's') {
                e.preventDefault();
                if (!selectedFile) return;

                syncFileContent(selectedFile.content);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFile]);

    if (!selectedFile) return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a file and start coding
        </div>
    );

    return (
        <Editor
            height="100%"
            language={getLanguageFromName(selectedFile.name)}
            value={selectedFile.content}
            options={{
                "semanticHighlighting.enabled": true,
                acceptSuggestionOnEnter: "on",
                autoClosingBrackets: "always",
                autoClosingComments: "always",
                padding: {
                    top: 6,
                }
            }}
            onMount={handleEditorDidMount}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={syncFileContent}
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
    "c++": "cpp",
    "mjs": "javascript"
}

function getLanguageFromName(name: string) {
    let ext = name.split('.').pop();

    return langObj?.[ext as keyof typeof langObj] || "plaintext";
}