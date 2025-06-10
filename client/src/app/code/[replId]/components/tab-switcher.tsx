"use client"

import { useEffect, useState, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCodingStates } from "@/context/coding-states-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./file-icons"
import { TFileItem } from "./file-tree"
import { useParams, useRouter } from "next/navigation"

export function FileTabSwitcher() {
    const { selectedFile, setSelectedItem, setSelectedFile, setMruFiles, mruFiles } = useCodingStates();
    const router = useRouter();
    const { replId } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isAltPressed, setIsAltPressed] = useState(false);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Track Alt key state
            if (event.key === "Alt") {
                setIsAltPressed(true)
            }

            // Check for Alt+E to open switcher
            if (event.altKey && event.key.toLowerCase() === "e") {
                event.preventDefault()

                if (mruFiles.length === 0) return;

                if (!isOpen) {
                    // First time pressing Alt+E - show switcher and start from second file (index 1)
                    setIsOpen(true)
                    setSelectedIndex(1) // Start from second file in MRU order
                } else {
                    // Already visible - navigate to next file
                    setSelectedIndex((prevIndex) => (prevIndex + 1) % mruFiles.length)
                }
            }

            // Check for Alt+Shift+E to navigate backwards
            if (event.altKey && event.shiftKey && event.key.toLowerCase() === "e") {
                event.preventDefault()

                if (mruFiles.length === 0) return;

                if (!isOpen) {
                    // First time pressing Alt+Shift+E - show switcher and start from last file
                    setIsOpen(true)
                    setSelectedIndex(mruFiles.length - 1)
                } else {
                    // Already visible - navigate to previous file
                    setSelectedIndex((prevIndex) => (prevIndex - 1 + mruFiles.length) % mruFiles.length)
                }
            }

            // Arrow keys navigation when switcher is visible
            if (isOpen) {
                if (event.key === "ArrowDown") {
                    event.preventDefault()
                    setSelectedIndex((prevIndex) => (prevIndex + 1) % mruFiles.length)
                } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    setSelectedIndex((prevIndex) => (prevIndex - 1 + mruFiles.length) % mruFiles.length)
                } else if (event.key === "Enter") {
                    event.preventDefault()
                    const selectedFileItem = mruFiles[selectedIndex];
                    if (selectedFileItem) {
                        onFileSelect(selectedFileItem);
                    }
                } else if (event.key === "Escape") {
                    event.preventDefault()
                    setIsOpen(false)
                }
            }
        },
        [isOpen, mruFiles.length, mruFiles],
    )

    const handleKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Alt") {
                setIsAltPressed(false)
                if (isOpen) {
                    // Alt released - select the file and hide switcher
                    const selectedFileItem = mruFiles[selectedIndex];
                    if (selectedFileItem) {
                        onFileSelect(selectedFileItem);
                    }
                    setIsOpen(false)
                }
            }
        },
        [isOpen, selectedIndex, mruFiles],
    )

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
        }
    }, [handleKeyDown, handleKeyUp])

    // Hide switcher if Alt is not pressed (safety measure)
    useEffect(() => {
        if (isOpen && !isAltPressed) {
            const timer = setTimeout(() => {
                setIsOpen(false)
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen, isAltPressed]);

    function onFileSelect(file: TFileItem) {
        setSelectedFile(file);
        setSelectedItem(file);
        setMruFiles(prev => [file, ...prev.filter(f => f.path !== file.path)]);

        window.requestAnimationFrame(() => {
            router.push(`/code/${replId}?path=${file.path}`);
        });

    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md [&>button]:hidden p-0 px-2">
                <DialogTitle className="sr-only">Open file</DialogTitle>
                <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <div className="flex flex-col py-2">
                        {mruFiles.map((file, index) => {
                            const isSelected = index === selectedIndex
                            const isActive = file.path === selectedFile?.path

                            return (
                                <div
                                    key={file.path}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer",
                                        isSelected ? "bg-accent" : "hover:bg-muted",
                                        isActive ? "font-medium" : ""
                                    )}
                                    onClick={() => {
                                        onFileSelect(file);
                                        setIsOpen(false)
                                    }}
                                >
                                    {getFileIcon(file.name)}
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
                                        {file.path.includes("/") ? file.path.split("/").slice(0, -1).join("/") : ""}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}