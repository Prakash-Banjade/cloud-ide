import { EItemType, TFileItem, TFolderItem, TreeItem } from "../components/file-tree"

/**
 * Insert `item` into `tree` at the correct nested spot based on its `.path`.
 * Creates any missing folders along the way.
 */
export function insertTreeItem(
    tree: TreeItem[],
    item: TreeItem
): TreeItem[] {
    // split "/a/b/c.txt" → ["a","b","c.txt"]
    const segments = item.path.split("/").filter(Boolean)
    // recursive helper carries a `prefix` so we can construct folder paths
    function helper(
        nodes: TreeItem[],
        segs: string[],
        prefix: string
    ): TreeItem[] {
        // if no more segments, nothing to insert
        if (segs.length === 0) return nodes

        const [head, ...rest] = segs
        const currentPath = prefix + "/" + head

        // if this is the last segment, insert `item` here
        if (rest.length === 0) {
            // remove any existing entry with same path, then append the new item
            return [
                ...(Array.isArray(nodes) ? nodes.filter(n => n.path !== item.path) : []),
                item
            ]
        }

        // we’re inserting deeper – find or create the folder `head`
        const existing = nodes.find(
            n => n.type === EItemType.DIR && n.name === head
        ) as TFolderItem | undefined

        const folder: TFolderItem = existing
            ? {
                ...existing,
                expanded: true
            }
            : {
                name: head,
                type: EItemType.DIR,
                path: currentPath,
                expanded: true,
                children: []
            }

        // recurse into that folder’s children
        const newChildren = helper(folder.children, rest, currentPath)

        const newFolder: TFolderItem = {
            ...folder,
            children: newChildren
        }

        // rebuild this level: replace the old folder (if any) with the new one
        const others = nodes.filter(
            n => !(n.type === EItemType.DIR && n.name === head)
        )

        return [...others, newFolder]
    }

    return helper(tree, segments, "")
}

export function removeItemFromTree(tree: TreeItem[], targetPath: string): TreeItem[] {
    function recursiveRemove(items: TreeItem[]): TreeItem[] {
        return items
            ?.filter(item => item.path !== targetPath) // Remove if path matches
            .map(item => {
                if (item.type === 'dir') {
                    const updatedChildren = recursiveRemove((item as TFolderItem).children);
                    return { ...item, children: updatedChildren };
                }
                return item;
            });
    }

    return recursiveRemove(tree);
}

/**
 * Rename a tree item at oldPath to newPath, updating that item and all its descendants.
 * Returns a new tree (no mutation).
 * 
 * @param tree - the original tree
 * @param oldPath - the exact path of the item to rename
 * @param newPath - the new desired path
 */
export function renameTreeItem(
    tree: TreeItem[],
    oldPath: string,
    newPath: string
): TreeItem[] {
    const renameRec = (items: TreeItem[]): TreeItem[] =>
        items?.map(item => {
            // Compute updated path: if item's path is under oldPath, replace prefix
            const isAffected = item.path === oldPath || item.path.startsWith(oldPath + '/');
            const updatedPath = isAffected
                ? item.path.replace(oldPath, newPath)
                : item.path;

            // Compute updated name: last segment of updated path
            const segments = updatedPath.split('/').filter(Boolean);
            const updatedName = segments.length > 0 ? segments[segments.length - 1] : '';

            if (item.type === 'dir') {
                // Recurse into children
                const folder = item as TFolderItem;
                const newChildren = renameRec(folder.children);
                return {
                    ...folder,
                    name: isAffected ? updatedName : folder.name,
                    path: updatedPath,
                    children: newChildren,
                };
            } else {
                // File
                const file = item as TFileItem;
                return {
                    ...file,
                    name: isAffected ? updatedName : file.name,
                    path: updatedPath,
                };
            }
        });

    return renameRec(tree);
}