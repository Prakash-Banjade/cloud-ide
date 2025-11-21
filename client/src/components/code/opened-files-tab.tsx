
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getFileIcon } from "./file-icons";
import { onFileSelect } from "@/app/code/[replId]/fns/file-manager-fns";
import { useSocket } from "@/context/socket-provider";
import { useCodingStates } from "@/context/coding-states-provider";
import { TFileItem } from "@/types/tree.types";

export default function OpenedFilesTab() {
    const { selectedFile, openedFiles, setOpenedFiles, setSelectedFile, setSelectedItem, setMruFiles, mruFiles } = useCodingStates();
    const selectedTabRef = useRef<HTMLDivElement>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (selectedTabRef.current) {
            // scroll only the inline axis (horizontal) so it moves left/right
            selectedTabRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",   // no vertical scroll change
                inline: "nearest",  // move horizontally just enough to see it
            });
        }
    }, [selectedFile]);

    function handleRemoveOpenedFile(file: TFileItem) {
        setOpenedFiles(prev => prev.filter((f) => f.path !== file.path));

        const newMruFiles = mruFiles.filter((f) => f.path !== file.path);
        setMruFiles(newMruFiles);

        if (file.path === selectedFile?.path) {
            selectFile(newMruFiles[0]);
        }
    }

    function selectFile(file: TFileItem | undefined) {
        if (!socket) return;

        if (file) {
            onFileSelect({ file, setSelectedFile, setSelectedItem, socket });
            setMruFiles(prev => [file, ...prev.filter(f => f.path !== file.path)]); // update MRU
            return;
        }

        setSelectedFile(file);
        setSelectedItem(file);
    }

    return (
        <ScrollArea className="overflow-x-auto max-w-full">
            <div className="flex">
                {
                    openedFiles.map((file) => {
                        const isSelected = file.path === selectedFile?.path;

                        return (
                            <div
                                key={file.path}
                                ref={isSelected ? selectedTabRef : null}
                                role="button"
                                className={cn("group flex items-center gap-2 cursor-pointer p-2 pl-3", isSelected && "dark:bg-[#1e1e1e] bg-white font-medium rounded-md")}
                                style={{ boxShadow: isSelected ? "inset 0 1px brand" : "" }}
                                onClick={() => selectFile(file)}
                            >
                                <span>
                                    {getFileIcon(file.name)}
                                </span>

                                <span className="max-w-[12ch] truncate text-xs">
                                    {file.name}
                                </span>

                                <button
                                    type="button"
                                    className={cn("hover:bg-white/10 p-1 rounded-sm hover:cursor-pointer", !isSelected && "invisible group-hover:visible pointer-events-none group-hover:pointer-events-auto")}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveOpenedFile(file)
                                    }}
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        )
                    })
                }
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
    );
}