import Editor, { Monaco } from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { useTheme } from "next-themes";
import { IStandaloneCodeEditor, useCodingStates } from "@/context/coding-states-provider";
import { useEffect, useRef } from "react";
import { SocketEvents } from "@/lib/CONSTANTS";
import { EPermission } from "@/types/types";
import { updateFileContent } from "@/app/code/[replId]/fns/tree-mutation-fns";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getLanguageFromName, NoFileSelected, udpateRemoteSelectionStyle, updateRemoteCursorStyle } from "./editor-utils";
import { debounce } from "@/lib/utils";

export const CodeEditor = ({ socket }: { socket: Socket }) => {
    const { theme } = useTheme();
    const { setIsSyncing, selectedFile, setEditorInstance, editorInstance, permission, setFileStructure } = useCodingStates();
    const remoteUsers = useRef<Record<string, {
        cursor: monaco.editor.IEditorDecorationsCollection,
        selection: monaco.editor.IEditorDecorationsCollection
    }>>({});

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
        if (permission === EPermission.READ) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === 's') {
                e.preventDefault();
                if (!selectedFile) return;

                syncFileContent(editorInstance?.getValue());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFile, editorInstance]);

    useEffect(() => {
        if (!socket || !editorInstance) return;

        socket.on(SocketEvents.ITEM_UPDATED, (data: { path: string, content: string }) => {
            if (!data.path || typeof data.content !== 'string') return;
            console.log('item-updated', data);

            if (selectedFile && selectedFile.path === data.path) {
                editorInstance.setValue(data.content);
            };

            setFileStructure(prev => updateFileContent(prev, data.path, data.content));
        });

        const cursorDisposable = editorInstance.onDidChangeCursorPosition(evt => {
            socket.emit(SocketEvents.CURSOR_MOVE, {
                path: selectedFile?.path,
                position: evt.position,
            });
        });

        const selectionDisposable = editorInstance.onDidChangeCursorSelection((e) => {
            const sel = e.selection;
            socket.emit(SocketEvents.SELECTION_CHANGE, {
                path: selectedFile?.path,
                start: {
                    lineNumber: sel.startLineNumber,
                    column: sel.startColumn
                },
                end: {
                    lineNumber: sel.endLineNumber,
                    column: sel.endColumn
                },
            });
        });

        return () => {
            socket.off(SocketEvents.ITEM_UPDATED);
            cursorDisposable?.dispose();
            selectionDisposable?.dispose();
        }
    }, [socket, selectedFile, editorInstance]);

    useEffect(() => {
        if (!socket || !editorInstance) return;

        socket.on(SocketEvents.CURSOR_MOVE, ({ socketId, path, position, color, user }) => {
            if (path !== selectedFile?.path) return; // decorate only if the file is open

            // create the collection if first time
            if (!remoteUsers.current[socketId]) {
                remoteUsers.current[socketId] = {
                    cursor: editorInstance.createDecorationsCollection(),
                    selection: editorInstance.createDecorationsCollection(),
                };
            }
            const collection = remoteUsers.current[socketId].cursor;

            const range = new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            );

            collection.set([{
                range,
                options: {
                    className: `remoteCursor-${socketId}`,
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                }
            }]);

            updateRemoteCursorStyle(socketId, user, color);
        });

        socket.on(SocketEvents.SELECTION_CHANGE, ({ socketId, path, start, end, color }) => {
            if (path !== selectedFile?.path) return; // decorate only if the file is open

            const rec = remoteUsers.current[socketId];
            if (!rec) return;

            // When selection collapsed, clear highlight
            if (start.lineNumber === end.lineNumber && start.column === end.column) {
                rec.selection.clear();
                return;
            }

            const selRange = new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
            rec.selection.set([{
                range: selRange,
                options: {
                    className: `remoteSelection-${socketId}`,
                    isWholeLine: false
                }
            }]);

            udpateRemoteSelectionStyle(socketId, color);
        });

        socket.on(SocketEvents.USER_LEFT, ({ socketId }) => {
            const rec = remoteUsers.current[socketId]?.cursor;
            if (!rec) return;

            // dispose the decoration collection → removes the cursor line
            rec.clear();

            // clean up the stored ref
            delete remoteUsers.current[socketId];

            // remove injected CSS:
            [
                `remoteCursor-${socketId}`, // cursor
                `remoteSelection-${socketId}`, // selection
            ].forEach(styleSelector => {
                const styleEl = document.getElementById(styleSelector);
                if (styleEl) styleEl.remove();
            })
        });

        return () => {
            socket.off(SocketEvents.CURSOR_MOVE)
            socket.off(SocketEvents.SELECTION_CHANGE)
            socket.off(SocketEvents.USER_LEFT)
        };
    }, [socket, editorInstance]);

    if (!selectedFile) return <NoFileSelected />;

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
    )
}
