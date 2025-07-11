import Editor, { Monaco } from "@monaco-editor/react";
import { Socket } from "socket.io-client";
import { useTheme } from "next-themes";
import { IStandaloneCodeEditor, useCodingStates } from "@/context/coding-states-provider";
import { useEffect, useRef } from "react";
import { SocketEvents } from "@/lib/CONSTANTS";
import { EPermission } from "@/types/types";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getLanguageFromName, NoFileSelected, removeInjectedCss, udpateRemoteSelectionStyle, updateRemoteCursorStyle } from "./editor-utils";
import { debounce } from "@/lib/utils";
import { useSession } from "next-auth/react";

export const CodeEditor = ({ socket }: { socket: Socket }) => {
    const { theme } = useTheme();
    const { data: session } = useSession();
    const { setIsSyncing, selectedFile, setEditorInstance, editorInstance, permission, setFileStructure } = useCodingStates();
    const remoteUsers = useRef<Record<string, {
        cursor: monaco.editor.IEditorDecorationsCollection,
        selection: monaco.editor.IEditorDecorationsCollection
    }>>({});
    const isUpdatingRemote = useRef(false);

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
    }, 1000);

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
        if (!socket || !editorInstance || !session) return;

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

        const contentDisposable = editorInstance.onDidChangeModelContent((e) => {
            if (permission === EPermission.READ) return;
            if (isUpdatingRemote.current) return; // prevent echo

            const payload = {
                path: selectedFile?.path,
                changes: e.changes,          // contains an array of changes
                versionId: editorInstance.getModel()?.getVersionId()
            };
            socket.emit(SocketEvents.CODE_CHANGE, payload);

            // TODO: should send only diffs
            const value = editorInstance.getValue();
            syncFileContent(value);
            if (selectedFile) {
                selectedFile.content = value ?? "";
            }
        });

        socket.on(SocketEvents.CURSOR_MOVE, ({
            path, position, color, user
        }: {
            path: string, position: monaco.Position, color: string, user: { userId: string, name: string }
        }) => {
            if (path !== selectedFile?.path) { // decorate only if the file is open
                removeInjectedCss(user.userId); // remove injected css because the file user is working on is not selected right now
                return;
            }

            // create the collection if first time
            if (!remoteUsers.current[user.userId]) {
                remoteUsers.current[user.userId] = {
                    cursor: editorInstance.createDecorationsCollection(),
                    selection: editorInstance.createDecorationsCollection(),
                };
            }
            const collection = remoteUsers.current[user.userId].cursor;

            const range = new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            );

            collection.set([{
                range,
                options: {
                    className: `remoteCursor-${user.userId}`,
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                }
            }]);

            updateRemoteCursorStyle(user.userId, user, color);
        });

        socket.on(SocketEvents.SELECTION_CHANGE, ({ userId, path, start, end, color }) => {
            if (path !== selectedFile?.path) return; // decorate only if the file is open

            const rec = remoteUsers.current[userId];
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
                    className: `remoteSelection-${userId}`,
                    isWholeLine: false
                }
            }]);

            udpateRemoteSelectionStyle(userId, color);
        });

        socket.on(SocketEvents.USER_LEFT, ({ userId }) => {
            const rec = remoteUsers.current[userId]?.cursor;
            if (!rec) return;

            // dispose the decoration collection → removes the cursor line
            rec.clear();

            // clean up the stored ref
            delete remoteUsers.current[userId];

            // remove injected CSS:
            removeInjectedCss(userId);
        });

        socket.on(SocketEvents.CODE_CHANGE, (data: {
            userId: string;
            path: string;
            changes: monaco.editor.IModelContentChange[];
            versionId: number;
        }) => {
            if (selectedFile?.path !== data.path) return;

            const model = editorInstance.getModel();
            if (!model) return;

            isUpdatingRemote.current = true;

            editorInstance.executeEdits(
                "remote",
                data.changes.map(c => ({
                    range: new monaco.Range(
                        c.range.startLineNumber, c.range.startColumn,
                        c.range.endLineNumber, c.range.endColumn
                    ),
                    text: c.text,
                    forceMoveMarkers: true
                }))
            );

            isUpdatingRemote.current = false;
        });

        return () => {
            cursorDisposable?.dispose();
            selectionDisposable?.dispose();
            contentDisposable?.dispose();
            socket.off(SocketEvents.ITEM_UPDATED);
            socket.off(SocketEvents.CURSOR_MOVE)
            socket.off(SocketEvents.SELECTION_CHANGE)
            socket.off(SocketEvents.USER_LEFT)
            socket.off(SocketEvents.CODE_CHANGE)
        }
    }, [socket, selectedFile, editorInstance, session]);

    useEffect(() => {
        if (!remoteUsers.current) return;

        for (const key in remoteUsers.current) {
            removeInjectedCss(key);
        }
    }, [selectedFile])

    if (!selectedFile) return <NoFileSelected />;

    return (
        <Editor
            height="100%"
            language={getLanguageFromName(selectedFile.name)}
            value={selectedFile.content}
            options={{
                padding: {
                    top: 6,
                },
                readOnly: permission === EPermission.READ
            }}
            onMount={handleEditorDidMount}
            theme={theme === "dark" ? "vs-dark" : "light"}
        />
    )
}
