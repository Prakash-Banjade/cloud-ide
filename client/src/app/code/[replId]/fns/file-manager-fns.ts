import { Socket } from "socket.io-client";
import { EItemType, TFileItem, TFolderItem, TreeItem } from "../components/file-tree";
import { Dispatch, SetStateAction } from "react";
import { useCodingStates } from "@/context/coding-states-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type RefreshTreeProps = {
    content: TreeItem[],
    socket: Socket,
    path?: string | undefined,
}

export function useRefreshTree() {
    const { setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles } = useCodingStates();
    const router = useRouter();
    const { replId } = useParams();
    const searchParams = useSearchParams();

    async function refreshTree({ content, socket }: RefreshTreeProps) {
        // first show whatever the server gave us at top-level
        let tree = content;
        setFileStructure(tree)

        // then expand any folders that are in the path
        const path = searchParams.get('path')
        if (!path) return

        // break “/a/b/c.txt” into ["a","b","c.txt"]
        const segments = path.split('/').filter(Boolean)
        let cumulative = ''

        // for each folder segment (all except the last)
        for (let i = 0; i < segments.length - 1; i++) {
            cumulative += '/' + segments[i]

            // do we already have that folder in our current tree?
            const folder = findItem(tree, cumulative)
            if (!folder || folder.type !== 'dir') break

            // if it has no children yet, fetch them
            if (!Array.isArray(folder.children)) {
                const data = await fetchDirAsync(socket, cumulative)
                tree = updateTree(tree, cumulative, data)
            }
            // if it already has children, just toggle expanded
            else {
                tree = updateTree(tree, cumulative, null)
            }

            // update state so UI shows the expansion as we go
            setFileStructure(tree)
        }

        // now finally select the last segment (could be file or dir)
        const target = findItem(tree, path)
        if (target) {
            // if it’s a file, fetch its content & mark selected
            onItemSelect(target, setFileStructure, setSelectedFile, setSelectedItem, setOpenedFiles, socket)
            // also push the same URL so router stays in sync
            if (target.type === 'file') {
                router.replace(`/code/${replId}?path=${target.path}`)
            }
        }
    }

    return refreshTree;
}

export const onItemSelect = (
    file: TreeItem,
    setFileStructure: Dispatch<SetStateAction<TreeItem[]>>,
    setSelectedFile: Dispatch<SetStateAction<TFileItem | undefined>>,
    setSelectedItem: Dispatch<SetStateAction<TreeItem | undefined>>,
    setOpenedFiles: Dispatch<SetStateAction<TFileItem[]>>,
    socket: Socket
) => {
    setSelectedItem(file); // just select what they clicked

    if (file.type === EItemType.DIR) {
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
        if (!file.content?.length) { // if no content is loaded, fetch the content
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data;
            });
        }

        setSelectedFile(file);
        setOpenedFiles(prev => {
            return prev.some(f => f.path === file.path) ? prev : [...prev, file];
        });
    }
};

export function updateTree(
    items: TreeItem[],
    targetPath: string,
    newChildren: TreeItem[] | null,
    expand: boolean = true,
): TreeItem[] {
    return items.map(item => {
        // only folders can match
        if (item.type === EItemType.DIR) {
            // did we hit the folder the user clicked?
            if (item.path === targetPath) {
                // either assign new children (if we just fetched them), or leave them alone
                const children = newChildren ?? item.children
                // toggle expanded
                const expanded = expand && (item.expanded ? false : true)
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
        if (item.type === EItemType.DIR && Array.isArray(item.children)) {
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

/**
 * Find the folder within `tree` whose `children` array directly contains
 * an item with path === target.path.  If none is found, returns a virtual root.
 */
export function getParentFolder(
    target: (TFileItem | TFolderItem) | undefined,
    tree: TreeItem[]
): TFolderItem {
    if (!target) return { // if no target, return a virtual root
        name: "",
        type: EItemType.DIR,
        path: "/",
        expanded: true,
        children: tree,
    }

    // 1) compute the parent-path string (everything up to the last "/")
    const idx = target.path.lastIndexOf("/")
    const parentPath = idx > 0 ? target.path.slice(0, idx) : "/"

    // 2) walk the tree looking for a folder whose path === parentPath
    function dfs(items: TreeItem[] | undefined): TFolderItem | null {
        if (!items) return null;

        for (const item of items) {
            if (item.type === EItemType.DIR) {
                if (item.path === parentPath) {
                    return item
                }
                // recurse into children
                const found = dfs(item.children)
                if (found) return found
            }
        }

        return null
    }

    const found = dfs(tree)

    if (found) {
        return found
    }

    // 3) if nothing matched, return a “virtual” root folder
    return {
        name: "",
        type: EItemType.DIR,
        path: "/",
        expanded: true,
        children: tree,
    }
}

/**
 * Return a new TreeItem[] sorted so that:
 *  - all folders come before files
 *  - names are alphabetical within each group
 *  - folders’ children are sorted recursively
 */
export function sortFolderFirst(tree: TreeItem[]): TreeItem[] {
    // first, shallow‐sort this array: dirs before files, then by name
    if (!Array.isArray(tree)) return tree;

    const sorted = [...tree].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === EItemType.DIR ? -1 : 1
        }
        return a.name.localeCompare(b.name)
    })

    // then, for every folder, recurse into children
    return sorted.map(item => {
        if (item.type === EItemType.DIR) {
            return {
                ...item,
                children: sortFolderFirst(item.children)
            }
        }
        return item
    })
}
