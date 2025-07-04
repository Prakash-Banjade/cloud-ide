import { insertTreeItem, removeItemFromTree } from "@/app/code/[replId]/fns/tree-mutation-fns";
import { EItemType, TFileItem, TFolderItem } from "@/components/code/file-tree";
import { useCodingStates } from "@/context/coding-states-provider";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

export default function useChokidar(socket: Socket | null) {
    const { setFileStructure } = useCodingStates();

    useEffect(() => {
        if (!socket) return;

        socket.on('chokidar:file-added', (data: { path: string }) => {
            console.log('chokidar:file-added', data);

            const itemPath = data.path;
            if (!itemPath) return;

            const name = itemPath.split('/').pop() || '';

            const fileItem: TFileItem = {
                name,
                path: itemPath,
                type: EItemType.FILE,
                language: name.split('.').pop(),
                content: '',
            };

            setFileStructure(prev => insertTreeItem(prev, fileItem)); // insert the new item in the tree
        });

        socket.on('chokidar:file-removed', (data: { path: string }) => {
            console.log('chokidar:file-removed', data);
            setFileStructure(prev => removeItemFromTree(prev, data.path));
        });

        socket.on('chokidar:dir-added', (data: { path: string }) => {
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

            setFileStructure(prev => insertTreeItem(prev, folderItem)); // insert the new item in the tree
        });

        socket.on('chokidar:dir-removed', (data: { path: string }) => {
            console.log('chokidar:dir-removed', data);

            setFileStructure(prev => removeItemFromTree(prev, data.path));
        });

        socket.on('chokidar:file-changed', (data: { path: string }) => {
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