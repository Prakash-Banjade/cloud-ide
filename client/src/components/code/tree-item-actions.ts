import { useCodingStates } from "@/context/coding-states-provider";
import { useSocket } from "@/context/socket-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { EItemType, TreeItem } from "@/types/tree.types";

export function useDeleteTreeItem() {
    const { socket } = useSocket();
    const { setMruFiles, setOpenedFiles, setSelectedFile, mruFiles } = useCodingStates();

    function deleteItem({ path, type }: { path: string, type: EItemType }) {
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

    const handleDelete = (item: TreeItem) => {
        if (!socket) return;

        socket.emit(SocketEvents.DELETE_ITEM, { path: item.path, type: item.type }, (data: boolean) => {
            if (data) {
                deleteItem({ path: item.path, type: item.type });
            }
        });
    }

    return { deleteItem, handleDelete };
}