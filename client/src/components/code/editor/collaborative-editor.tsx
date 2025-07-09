"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useRoom } from "@liveblocks/react/suspense";
import { useEffect } from "react";
import { Editor, Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import { Cursors } from "./Cursors";
import { useTheme } from "next-themes";
import { IStandaloneCodeEditor, useCodingStates } from "@/context/coding-states-provider";
import { EPermission } from "@/types/types";
import { Socket } from "socket.io-client";
import { SocketEvents } from "@/lib/CONSTANTS";

export function CollaborativeEditor({ socket }: { socket: Socket }) {
    const room = useRoom();
    const provider = getYjsProviderForRoom(room);
    const { theme } = useTheme();
    const { setIsSyncing, selectedFile, setEditorInstance, editorInstance, permission } = useCodingStates();


    // Set up Liveblocks Yjs provider and attach Monaco editor
    useEffect(() => {
        if (!editorInstance) return;

        let binding: MonacoBinding;

        const yDoc = provider.getYDoc();
        const yText = yDoc.getText("monaco");

        // Attach Yjs to Monaco
        binding = new MonacoBinding(
            yText,
            editorInstance.getModel() as editor.ITextModel,
            new Set([editorInstance]),
            provider.awareness as unknown as Awareness,
        );

        return () => {
            binding?.destroy();
        };
    }, [editorInstance, room]);

    async function handleEditorDidMount(editor: IStandaloneCodeEditor, monaco: Monaco) {
        setEditorInstance(editor);
        window.requestAnimationFrame(() => {
            editor.focus()
        });

        if (selectedFile && getLanguageFromName(selectedFile.name) === 'typescript') {
            const modelUri = monaco.Uri.file(selectedFile.path ?? "");

            const codeModel = monaco.editor.createModel(
                selectedFile.content ?? "",
                "typescript",
                modelUri
            );

            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                jsx: 2 // 2 means react
            });

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false
            })

            editor.setModel(codeModel);
        }
    }

    const syncFileContent = debounce((value: string | undefined) => {
        if (!selectedFile || value === undefined) return;

        // TODO: Should send diffs, for now sending the whole file
        setIsSyncing(true);
        socket.emit(SocketEvents.UPDATE_CONTENT, { path: selectedFile.path, content: value }, () => {
            setIsSyncing(false);
        });
    }, 500);

    // Sync file content on ctrl+s
    useEffect(() => {
        if (!editorInstance || permission === EPermission.READ) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === 's') {
                e.preventDefault();
                if (!selectedFile) return;

                syncFileContent(editorInstance.getValue());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFile, editorInstance]);

    if (!selectedFile) return <NoFileSelected />;

    return (
        <div className="h-full relative overflow-hidden">
            {provider ? <Cursors yProvider={provider} /> : null}
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
                    },
                    readOnly: permission === EPermission.READ
                }}
                onMount={handleEditorDidMount}
                theme={theme === "dark" ? "vs-dark" : "light"}
                onChange={val => {
                    if (permission === EPermission.READ) return;
                    syncFileContent(val);
                    if (selectedFile) {
                        selectedFile.content = val ?? "";
                    }
                }}
            />
        </div>
    );
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
    "mjs": "javascript",
    "java": "java",
}

function getLanguageFromName(name: string) {
    const ext = name.split('.').pop();

    return langObj?.[ext as keyof typeof langObj] || "plaintext";
}

function NoFileSelected() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <img src="/logo-white.png" alt="logo" className="opacity-5 hidden dark:block h-[30%] w-auto select-none" />
            <img src="/logo-dark.png" alt="logo" className="opacity-5 block dark:hidden h-[30%] w-auto select-none" />
            <table className="text-sm">
                <tbody>
                    <tr>
                        <td className="p-2 text-right">Toggle Terminal</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Ctrl</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">`</kbd>
                        </td>
                    </tr>
                    <tr>
                        <td className="p-2 text-right">Tab Switching</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Alt</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">e</kbd>
                        </td>
                    </tr>
                    <tr>
                        <td className="p-2 text-right">Manual Save</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Ctrl</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">s</kbd>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}