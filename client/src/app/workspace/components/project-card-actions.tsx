"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuButtonItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Edit, MoreVertical, Trash } from "lucide-react";
import { useState } from "react";
import ProjectRenameForm from "./project-rename-form";
import { TProject } from "@/types";
import { useAppMutation } from "@/hooks/useAppMutation";
import { ResponsiveAlertDialog } from "@/components/ui/responsive-alert-dialog";
import { useRouter } from "next/navigation";

export default function ProjectCardActions({ project }: { project: TProject }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { mutateAsync, isPending } = useAppMutation();

    async function onDelete() {
        await mutateAsync({
            endpoint: `/projects/${project.id}`,
            method: 'delete',
        });

        router.refresh();
    }

    return (
        <>
            <ResponsiveDialog
                title='Rename project'
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            >
                <ProjectRenameForm
                    defaultValues={{ projectName: project.name }}
                    projectId={project.id}
                    setIsOpen={setIsOpen}
                />
            </ResponsiveDialog>

            <ResponsiveAlertDialog
                title='Delete project'
                description='Are you sure you want to delete this project?'
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                action={onDelete}
                actionLabel="Delete"
                isLoading={isPending}
                loadingText="Deleting..."
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuButtonItem onClick={() => setIsOpen(true)}>
                        <Edit />
                        Rename
                    </DropdownMenuButtonItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={isPending} onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="text-destructive" />
                        <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}