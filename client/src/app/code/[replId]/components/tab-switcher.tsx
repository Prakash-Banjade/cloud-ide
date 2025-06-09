"use client"

import { useEffect, useState, useCallback } from "react"
import { File } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCodingStates } from "@/context/coding-states-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getFileIcon } from "./file-icons"

export function FileTabSwitcher() {
    const { openedFiles, selectedFile, setSelectedItem, setSelectedFile } = useCodingStates();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isAltPressed, setIsAltPressed] = useState(false);

    const activeFileIndex = openedFiles.findIndex((file) => file.path === selectedFile?.path);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Track Alt key state
            if (event.key === "Alt") {
                setIsAltPressed(true)
            }

            // Check for Alt+E to open switcher
            if (event.altKey && event.key.toLowerCase() === "e") {
                event.preventDefault()

                if (openedFiles.length === 0) return;

                if (!isOpen) {
                    // First time pressing Alt+E - show switcher and start from next file
                    setIsOpen(true)
                    const nextIndex = (activeFileIndex + 1) % openedFiles.length
                    setSelectedIndex(nextIndex)
                } else {
                    // Already visible - navigate to next file
                    setSelectedIndex((prevIndex) => (prevIndex + 1) % openedFiles.length)
                }
            }

            // Check for Alt+Shift+E to navigate backwards
            if (event.altKey && event.shiftKey && event.key.toLowerCase() === "e") {
                event.preventDefault()

                if (!isOpen) {
                    // First time pressing Alt+Shift+E - show switcher and start from previous file
                    setIsOpen(true)
                    const prevIndex = (activeFileIndex - 1 + openedFiles.length) % openedFiles.length
                    setSelectedIndex(prevIndex)
                } else {
                    // Already visible - navigate to previous file
                    setSelectedIndex((prevIndex) => (prevIndex - 1 + openedFiles.length) % openedFiles.length)
                }
            }

            // Arrow keys navigation when switcher is visible
            if (isOpen) {
                if (event.key === "ArrowDown") {
                    event.preventDefault()
                    setSelectedIndex((prevIndex) => (prevIndex + 1) % openedFiles.length)
                } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    setSelectedIndex((prevIndex) => (prevIndex - 1 + openedFiles.length) % openedFiles.length)
                } else if (event.key === "Enter") {
                    event.preventDefault()
                    setSelectedFile(openedFiles[selectedIndex])
                    setSelectedItem(openedFiles[selectedIndex])
                    setIsOpen(false)
                } else if (event.key === "Escape") {
                    event.preventDefault()
                    setIsOpen(false)
                }
            }
        },
        [isOpen, activeFileIndex, openedFiles.length, selectedIndex],
    )

    const handleKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Alt") {
                setIsAltPressed(false)
                if (isOpen) {
                    // Alt released - select the file and hide switcher
                    setSelectedFile(openedFiles[selectedIndex])
                    setSelectedItem(openedFiles[selectedIndex])
                    setIsOpen(false)
                }
            }
        },
        [isOpen, selectedIndex],
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
    }, [isOpen, isAltPressed])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md [&>button]:hidden p-0 px-2">
                <DialogTitle className="sr-only">Open file</DialogTitle>
                <ScrollArea className="max-h-[60vh] overflow-y-auto">
                    <div className="flex flex-col py-2">
                        {openedFiles.map((file, index) => {
                            const isSelected = index === selectedIndex
                            const isActive = index === activeFileIndex

                            return (
                                <div
                                    key={file.path}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer",
                                        isSelected ? "bg-accent" : "hover:bg-muted",
                                        isActive ? "font-medium" : ""
                                    )}
                                    onClick={() => {
                                        setSelectedItem(file)
                                        setSelectedFile(file)
                                        setIsOpen(false)
                                    }}
                                >
                                    {/* <File className="w-4 h-4 flex-shrink-0" /> */}
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
