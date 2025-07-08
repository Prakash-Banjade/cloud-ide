import { insertTreeItem, removeItemFromTree, renameTreeItem } from '@/app/code/[replId]/fns/tree-mutation-fns';
import { useCodingStates } from '@/context/coding-states-provider';
import { useSocket } from '@/context/socket-provider';
import { SocketEvents } from '@/lib/CONSTANTS';
import { EItemType, TreeItem } from '@/types/tree.types';
import { useEffect } from 'react'

export default function useListenTreeMutation() {
    const { setFileStructure } = useCodingStates();
    const { socket } = useSocket();

    const { deleteItem } = useDeleteTreeItem();

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.ITEM_CREATED, (data: { path: string, type: EItemType }) => {
            if (!data.path || !data.type) return;

            console.log('item-created', data);
            const name = data.path.split('/').pop() || '';

            const newTreeItem: TreeItem = {
                name,
                path: data.path,
                type: data.type,
                ...(data.type === EItemType.FILE ? {
                    language: name.split('.').pop(),
                    content: '',
                } : {}),
            } as TreeItem;

            setFileStructure(prev => insertTreeItem(prev, newTreeItem)); // insert the new item in the tree
        });

        socket.on(SocketEvents.ITEM_DELETED, (data: { path: string, type: EItemType }) => {
            if (!data.path || !data.type) return;

            console.log('item-deleted', data);
            deleteItem(data);
        });

        socket.on(SocketEvents.ITEM_RENAMED, (data: { oldPath: string, newPath: string }) => {
            if (!data.oldPath || !data.newPath) return;

            setFileStructure((prev) =>
                renameTreeItem(prev, data.oldPath, data.newPath)
            );

        });

        return () => {
            socket.off(SocketEvents.ITEM_CREATED);
            socket.off(SocketEvents.ITEM_DELETED);
            socket.off(SocketEvents.ITEM_RENAMED);
        }
    }, [socket])

}

export function useDeleteTreeItem() {
    const { setFileStructure, setMruFiles, setOpenedFiles, setSelectedFile, mruFiles } = useCodingStates();

    function deleteItem({ path, type }: { path: string, type: EItemType }) {
        setFileStructure(prev => removeItemFromTree(prev, path));

        setOpenedFiles(prev => prev.filter(f =>
            type === EItemType.FILE
                ? f.path !== path
                : !f.path.startsWith(path)
        ));
        const newMruFiles = mruFiles.filter(f =>
            type === EItemType.FILE
                ? f.path !== path
                : !f.path.startsWith(path)
        );
        setMruFiles(newMruFiles);
        setSelectedFile(newMruFiles[0]);
    }

    return { deleteItem };
}