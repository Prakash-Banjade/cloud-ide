"use client";

import { useCodingStates } from "@/context/coding-states-provider";
import { EPermission } from "@/types/types";
import { X } from "lucide-react";
import { useState } from "react";

export default function ReadOnlyTopBar() {
    const { permission } = useCodingStates();

    const [hasClosed, setHasClosed] = useState(sessionStorage.getItem("hasClosedReadOnlyTopBar"));

    const onClose = () => {
        setHasClosed("true");
        sessionStorage.setItem("hasClosedReadOnlyTopBar", "true");
    }

    if (permission === EPermission.WRITE) return null;

    if (hasClosed === "true") return null;

    return (
        <div
            className='border-yellow-500 text-yellow-500 bg-yellow-500/5 px-4 py-2 flex items-center justify-between'
        >
            <p className="text-sm">
                You are viewing a read-only preview. You don&apos;t have permission to make changes. You can request the owner to grant you write access.
            </p>

            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                title="Close"
            >
                <X size={18} />
            </button>
        </div>
    )
}