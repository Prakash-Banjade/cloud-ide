"use client"

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { useState } from "react";
import { NewProjectForm } from "./new-project-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useFetchData } from "@/hooks/useFetchData";
import { Skeleton } from "../ui/skeleton";

export default function CreateProjectButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { data, isLoading } = useFetchData<{ count: number }>({
        endpoint: "projects/count",
        queryKey: ["projects", "count"],
    });

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 justify-center items-center">
                <Skeleton className="w-[106px] h-9" />
                <Skeleton className="h-3 w-16" />
            </div>
        )
    }

    if (!data) return null;

    return (
        <>
            <ResponsiveSheet
                isOpen={data.count > 0 && isOpen}
                setIsOpen={setIsOpen}
                title="New project"
                description="Create a new project"
                className="w-full max-w-[500px]!"
            >
                <NewProjectForm />
            </ResponsiveSheet>

            <div className="flex flex-col gap-2 justify-center items-center">
                <Button
                    onClick={() => setIsOpen(true)}
                    disabled={data.count === 0}
                >
                    <Plus />
                    New App
                </Button>
                <span className="text-xs text-muted-foreground">Remaining: {data.count}</span>
            </div>
        </>
    )
}