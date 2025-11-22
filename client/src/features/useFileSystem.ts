import { updateTree } from "@/app/code/[replId]/fns/file-manager-fns";
import { useCodingStates } from "@/context/coding-states-provider";
import { useSocket } from "@/context/socket-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { TFileItem, TFolderItem, TreeItem } from "@/types/tree.types";

export function useFileSystem() {
    const { socket } = useSocket();
    const {
        setSelectedFile,
        setSelectedItem,
        setOpenedFiles,
        setMruFiles,
        setFileStructure,
    } = useCodingStates();

    /**
     * Selects a file
     * @param file 
     * @description Updates opened and mru files, fetches file content if not loaded, sets file as selectedItem and selectedFile
     */
    function handleFileSelect(file: TFileItem) {
        if (!socket) return;

        // update opened and mru files
        setOpenedFiles(prev => prev.some(f => f.path === file.path) ? prev : [...prev, file]);
        setMruFiles(prev => [file, ...prev.filter(f => f.path !== file.path)]);

        if (typeof file.content === "string") { // file content is loaded, just select
            setSelectedFile(file);
            setSelectedItem(file);
            return;
        }

        // file content is not loaded, fetch it
        socket.emit(SocketEvents.FETCH_CONTENT, { path: file.path }, (data: string) => {
            file.content = data;
            setSelectedFile(file);
            setSelectedItem(file);
        });
    }

    /**
     * Selects a directory
     * @param dir 
     * @description Toggles the directory expanded state, fetches directory children if not loaded, sets directory as selectedItem
     */
    function handleDirSelect(dir: TFolderItem, toggleExpand: boolean = true) {
        setSelectedItem(dir);

        // if we already loaded children, just toggle expanded
        if (Array.isArray(dir.children)) {
            setFileStructure(prev => updateTree(prev, dir.path, null, toggleExpand))
            return;
        }

        // otherwise fetch children, then insert & expand
        socket?.emit(SocketEvents.FETCH_DIR, dir.path, (data: TreeItem[]) => {
            setFileStructure(prev => updateTree(prev, dir.path, data, toggleExpand))
        })
    }

    return {
        handleFileSelect,
        handleDirSelect
    }
}