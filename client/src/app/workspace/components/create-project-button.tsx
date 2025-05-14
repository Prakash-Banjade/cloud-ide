"use client"

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { useState } from "react";
import { NewProjectForm } from "./new-project-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CreateProjectButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <ResponsiveSheet
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                title="New project"
                description="Create a new project"
                className="w-full !max-w-[500px]"
            >
                <NewProjectForm />
            </ResponsiveSheet>

            <Button onClick={() => setIsOpen(true)}>
                <Plus />
                New App
            </Button>
        </>
    )
}