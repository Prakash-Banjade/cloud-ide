import { findItem } from "@/app/code/[replId]/fns/file-manager-fns";
import { useCodingStates } from "@/context/coding-states-provider";
import { useSocket } from "@/context/socket-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { EItemType } from "@/types/tree.types";
import { useCallback, useEffect, useRef } from "react";
import { useFileSystem } from "./useFileSystem";

export function useRemoteUsers() {
    const { socket } = useSocket();
    const {
        observedUser,
        setObservedUser,
        fileStructure,
        selectedFile
    } = useCodingStates();
    const remoteUserSelections = useRef<Record<string, string | null>>({});
    const { handleFileSelect } = useFileSystem();

    const syncObservedSelection = useCallback((path: string | null | undefined) => {
        if (!path || !socket) return;

        const found = findItem(fileStructure, path, socket);

        if (found && found.type === EItemType.FILE) {
            handleFileSelect(found);
        }
    }, [fileStructure, socket]);

    /**
     * Notify other users about the selected file
     */
    useEffect(() => {
        if (!socket) return;

        socket.emit(SocketEvents.SELECTED_FILE, { path: selectedFile?.path ?? null });
    }, [socket, selectedFile?.path]);

    /**
     * Listen for remote user selections and user left events
     */
    useEffect(() => {
        if (!socket) return;

        const handleSelectedFile = ({ userId, path }: { userId: string, path: string | null }) => {
            remoteUserSelections.current[userId] = path;

            if (observedUser?.userId === userId) {
                syncObservedSelection(path);
            }
        }

        const handleUserLeft = ({ userId }: { userId: string }) => {
            delete remoteUserSelections.current[userId];
            setObservedUser(prev => prev?.userId === userId ? null : prev);
        }

        socket.on(SocketEvents.SELECTED_FILE, handleSelectedFile);
        socket.on(SocketEvents.USER_LEFT, handleUserLeft);

        return () => {
            socket.off(SocketEvents.SELECTED_FILE, handleSelectedFile);
            socket.off(SocketEvents.USER_LEFT, handleUserLeft);
        }
    }, [socket, observedUser, syncObservedSelection]);

    /**
     * Sync view with observed user's selection
     */
    useEffect(() => {
        if (!observedUser) return;

        const cachedPath = remoteUserSelections.current[observedUser.userId];
        if (cachedPath) {
            syncObservedSelection(cachedPath);
        }

        if (!socket) return;

        socket.emit(SocketEvents.WATCH_USER, { userId: observedUser.userId }, (data: { path: string | null }) => {
            syncObservedSelection(data?.path);
        });
    }, [socket, observedUser, syncObservedSelection]);

    /**
     * Exit watch mode on user interaction
     */
    useEffect(() => {
        if (!observedUser) return;

        const exitWatchMode = () => setObservedUser(null);
        const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

        events.forEach(evt => window.addEventListener(evt, exitWatchMode));

        return () => {
            events.forEach(evt => window.removeEventListener(evt, exitWatchMode));
        }
    }, [observedUser]);
}
