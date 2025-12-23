import { insertTreeItems, removeItemFromTree } from "@/app/code/[replId]/fns/tree-mutation-fns";
import { EItemType, TFileItem, TFolderItem } from "@/types/tree.types";
import { useCodingStates } from "@/context/coding-states-provider";
import { useEffect } from "react";
import { SocketEvents } from "@/lib/CONSTANTS";
import { useSocket } from "@/context/socket-provider";
import { useDeleteTreeItem } from "@/components/code/tree-item-actions";

export default function useChokidar() {
    const { setFileStructure } = useCodingStates();
    const { socket } = useSocket();
    const { deleteItem } = useDeleteTreeItem();

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

            // update mru and opened files
            deleteItem({ path: data.path, type: EItemType.FILE })
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

            // update mru and opened files
            deleteItem({ path: data.path, type: EItemType.DIR })
        });

        socket.on(SocketEvents.FILE_CHANGED, (data: { path: string }) => {
            console.log('chokidar:file-changed', data);
        });

        return () => {
            socket.off(SocketEvents.FILE_CREATED);
            socket.off(SocketEvents.FILE_REMOVED);
            socket.off(SocketEvents.DIR_CREATED);
            socket.off(SocketEvents.DIR_REMOVED);
            socket.off(SocketEvents.FILE_CHANGED);
        };
    }, [socket])
}