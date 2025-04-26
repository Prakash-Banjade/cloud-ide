import { Dispatch, SetStateAction } from "react";
import { TreeItem } from "./file-tree";
import { Socket } from "socket.io-client";

export const onItemSelect = (
    file: TreeItem,
    setFileStructure: Dispatch<SetStateAction<TreeItem[]>>,
    setSelectedFile: Dispatch<SetStateAction<TreeItem | undefined>>,
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

function updateTree(
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