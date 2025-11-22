"use client";

import { useFetchData } from "@/hooks/useFetchData";
import { X } from "lucide-react";
import React from "react";

export default function MaintenanceNotice() {
    const { data, isLoading } = useFetchData<{ status: string }>({
        endpoint: "health",
        queryKey: ["health"],
    });

    const [isVisible, setIsVisible] = React.useState(() => {
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("maintenance-notice-dismissed");
        }
    });

    React.useEffect(() => {
        const dismissed = sessionStorage.getItem("maintenance-notice-dismissed");
        if (dismissed) {
            setIsVisible(false);
        }
    }, []);

    if (isLoading) return null;

    if (!isVisible) return null;

    if (data?.status === "ok") return null;

    return (
        <div className="py-3 px-4 flex items-center gap-4 bg-yellow-50 text-yellow-900 border-b border-yellow-200">
            <p className="text-center text-sm ml-auto">
                <strong>Important:</strong> Our backend is currently undergoing maintenance. We appreciate your patience while we work to restore full functionality
            </p>
            <button
                className="ml-auto text-yellow-600 hover:text-yellow-900 font-bold"
                onClick={() => {
                    sessionStorage.setItem("maintenance-notice-dismissed", "true");
                    setIsVisible(false);
                }}
            >
                <X size={18} />
            </button>
        </div>
    )
}