import { insertTreeItems, removeItemFromTree } from "@/app/code/[replId]/fns/tree-mutation-fns";
import { EItemType, TFileItem, TFolderItem } from "@/types/tree.types";
import { useCodingStates } from "@/context/coding-states-provider";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { SocketEvents } from "@/lib/CONSTANTS";

export default function useChokidar(socket: Socket | null) {
    const { setFileStructure } = useCodingStates();

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.FILE_CREATED, (data: { path: string, content: string }) => {
            console.log('chokidar:file-added', data);

            const itemPath = data.path;
            if (!itemPath) return;

            const name = itemPath.split('/').pop() || '';

            const fileItem: TFileItem = {
                name,
                path: itemPath,
                type: EItemType.FILE,
                language: name.split('.').pop(),
                content: data.content,
            };

            const parentFolder = fileItem.path.split('/').slice(0, -1).join('/');

            setFileStructure(prev => insertTreeItems(prev, [fileItem], parentFolder)); // insert the new item in the tree
        });

        socket.on(SocketEvents.FILE_REMOVED, (data: { path: string }) => {
            console.log('chokidar:file-removed', data);
            setFileStructure(prev => removeItemFromTree(prev, data.path));
        });

        socket.on(SocketEvents.DIR_CREATED, (data: { path: string }) => {
            console.log('chokidar:dir-added', data);

            const itemPath = data.path;
            if (!itemPath) return;

            const name = itemPath.split('/').pop() || '';

            const folderItem: TFolderItem = {
                name,
                path: itemPath,
                type: EItemType.DIR,
                children: [],
                expanded: false,
            };

            const parentFolder = folderItem.path.split('/').slice(0, -1).join('/');

            setFileStructure(prev => insertTreeItems(prev, [folderItem], parentFolder)); // insert the new item in the tree
        });

        socket.on(SocketEvents.DIR_REMOVED, (data: { path: string }) => {
            console.log('chokidar:dir-removed', data);

            setFileStructure(prev => removeItemFromTree(prev, data.path));
        });

        socket.on(SocketEvents.FILE_CHANGED, (data: { path: string }) => {
            console.log('chokidar:file-changed', data);
        });

        return () => {
            socket.off('chokidar:file-added');
            socket.off('chokidar:file-removed');
            socket.off('chokidar:dir-added');
            socket.off('chokidar:dir-removed');
            socket.off('chokidar:file-changed');
        };
    }, [socket])
}