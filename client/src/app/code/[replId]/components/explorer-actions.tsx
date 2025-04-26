import { TooltipWrapper } from '@/components/ui/tooltip'
import { CopyMinus, FilePlus2, FolderPlus, RotateCcw } from 'lucide-react'
import React from 'react'

type Props = {}

export default function ExplorerActions({ }: Props) {
    return (
        <section>
            <TooltipWrapper label="New file" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><FilePlus2 size={16} /></button>
            </TooltipWrapper>

            <TooltipWrapper label="New folder" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><FolderPlus size={16} /></button>
            </TooltipWrapper>

            <TooltipWrapper label="Refresh Explorer" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><RotateCcw size={16} /></button>
            </TooltipWrapper>

            <TooltipWrapper label="Collapse Folders in Explorer" contentProps={{ side: "bottom" }}>
                <button type="button" className="cursor-pointer hover:bg-secondary p-1 rounded-md"><CopyMinus size={16} /></button>
            </TooltipWrapper>
        </section>
    )
}