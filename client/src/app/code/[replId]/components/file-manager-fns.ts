import { Socket } from "socket.io-client";
import { TFileItem, TreeItem } from "./file-tree";
import { Dispatch, SetStateAction } from "react";

export const onItemSelect = (
    file: TreeItem,
    setFileStructure: Dispatch<SetStateAction<TreeItem[]>>,
    setSelectedFile: Dispatch<SetStateAction<TFileItem | undefined>>,
    socket: Socket
) => {
    if (file.type === "dir") {
        // if we already loaded children, just toggle expanded
        if (Array.isArray(file.children)) {
            setFileStructure(prev =>
                updateTree(prev, file.path, null)
            )
        }
        // otherwise fetch children, then insert & expand
        else {
            socket?.emit("fetchDir", file.path, (data: TreeItem[]) => {
                setFileStructure(prev =>
                    updateTree(prev, file.path, data)
                )
            })
        }
    } else {
        socket?.emit("fetchContent", { path: file.path }, (data: string) => {
            file.content = data;
            setSelectedFile(file);
        });
    }
};

export function updateTree(
    items: TreeItem[],
    targetPath: string,
    newChildren: TreeItem[] | null,
): TreeItem[] {
    return items.map(item => {
        // only folders can match
        if (item.type === "dir") {
            // did we hit the folder the user clicked?
            if (item.path === targetPath) {
                // either assign new children (if we just fetched them), or leave them alone
                const children = newChildren ?? item.children
                // toggle expanded
                const expanded = item.expanded ? false : true
                return { ...item, children, expanded }
            }
            // otherwise, even if this isn't the folder, its children might contain it:
            const children = item.children
                ? updateTree(item.children, targetPath, newChildren)
                : item.children
            return { ...item, children }
        }
        // files are untouched
        return item
    })
}


// helper to recursively find any item by path
export function findItem(items: TreeItem[], targetPath: string): TreeItem | undefined {
    for (const item of items) {
        if (item.path === targetPath) return item
        if (item.type === 'dir' && Array.isArray(item.children)) {
            const found = findItem(item.children, targetPath)
            if (found) return found
        }
    }
}

// helper to wrap socket.emit dir-fetch in a Promise
export function fetchDirAsync(socket: Socket, path: string): Promise<TreeItem[]> {
    return new Promise(resolve => {
        socket.emit('fetchDir', path, (data: TreeItem[]) => resolve(data))
    })
}