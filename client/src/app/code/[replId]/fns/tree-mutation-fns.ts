import { EItemType, TFileItem, TFolderItem, TreeItem } from "@/types/tree.types";

/**
 * Insert `items` into `tree` at the parentPath.
 */
// TODO: if the parent already contains one of the item, it is not being replaced causing duplicates, handle this
export function insertTreeItems(
    tree: TreeItem[],
    items: TreeItem[],
    parentPath: string
): TreeItem[] {
    // Normalize so "/a/b" and "a/b" behave the same:
    const cleanParent = parentPath.replace(/^\/+|\/+$/g, '');

    // If inserting at the root, just merge there:
    if (!cleanParent) {
        // Remove any existing nodes whose path conflicts with our items:
        const filtered = tree.filter(n => !items.some(i => i.path === n.path));
        return [...filtered, ...items];
    }

    // Otherwise split the parent path into segments:
    const parentSegments = cleanParent.split('/');

    // Recursive helper: walks down the segments and rebuilds folders immutably
    function helper(nodes: TreeItem[], segs: string[], prefix: string): TreeItem[] {
        const [head, ...rest] = segs;
        const thisPath = prefix + '/' + head;

        // If we’re at the target folder (no more rest), merge here:
        if (rest.length === 0) {
            // Find or create the folder to insert into:
            const existing = nodes.find(
                n => n.type === EItemType.DIR && n.path === thisPath
            ) as TFolderItem | undefined;

            const folder: TFolderItem = existing
                ? { ...existing, expanded: true }
                : { type: EItemType.DIR, name: head, path: thisPath, expanded: true, children: [] };

            // Merge its children: drop any that conflict with our items, then append
            const filteredChildren = folder.children?.filter(
                c => !items.some(i => i.path === c.path)
            ) ?? [];
            const newChildren = [...filteredChildren, ...items];

            const newFolder: TFolderItem = { ...folder, children: newChildren };

            // Rebuild this level: replace the old folder (if any) with the new one
            const others = nodes.filter(n => !(n.type === EItemType.DIR && n.path === thisPath));
            return [...others, newFolder];
        }

        // Not yet at target: descend into or create this folder
        const existing = nodes.find(
            n => n.type === EItemType.DIR && n.path === thisPath
        ) as TFolderItem | undefined;

        const folder: TFolderItem = existing
            ? { ...existing, expanded: true }
            : { type: EItemType.DIR, name: head, path: thisPath, expanded: true, children: [] };

        // Recurse on its children
        const newChildren = helper(folder.children, rest, thisPath);
        const newFolder: TFolderItem = { ...folder, children: newChildren };

        // Rebuild this level:
        const others = nodes.filter(n => !(n.type === EItemType.DIR && n.path === thisPath));
        return [...others, newFolder];
    }

    return helper(tree, parentSegments, '');
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

/**
 * Returns a new tree where the file at `targetPath` has its `content` replaced by `newContent`.
 */
export function updateFileContent(
    tree: TreeItem[],
    targetPath: string,
    newContent: string
): TreeItem[] {
    return tree.map(item => {
        // If this is the file we’re looking for, return a new object with updated content
        if (item.type === EItemType.FILE && item.path === targetPath) {
            return { ...item, content: newContent };
        }
        // If this is a directory, recurse into its children
        if (item.type === EItemType.DIR && item.children) {
            const updatedChildren = updateFileContent(item.children, targetPath, newContent);
            // Only create a new dir object if any of its children changed
            if (updatedChildren !== item.children) {
                return { ...item, children: updatedChildren };
            }
        }
        // Otherwise, return the item untouched
        return item;
    });
}