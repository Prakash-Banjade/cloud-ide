"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuButtonItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Edit, MoreVertical, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import ProjectRenameForm from "./project-rename-form";
import { TProjectsResponse } from "@/types/types";
import { ResponsiveAlertDialog } from "@/components/ui/responsive-alert-dialog";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { deleteProject } from "@/lib/actions/project.actions";
import cookie from 'js-cookie';
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectCardActions({ project }: { project: TProjectsResponse["data"][0] }) {
    const { data: session, status } = useSession();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    function onDelete() {
        startTransition(async () => {
            try {
                const res = await deleteProject(project.id);

                // remove cookies associated with project
                cookie.remove(`openedFiles:${project.replId}`);
                cookie.remove(`mruFiles:${project.replId}`);
                cookie.remove(`selectedFile:${project.replId}`);

                toast.success(res.message);
                setIsDeleteOpen(false);

                queryClient.invalidateQueries({
                    queryKey: ["projects", "count"],
                });
            } catch (e) {
                console.log(e);
                toast.error('Something went wrong. Please try again.');
            }
        });
    }

    if (status !== "loading" && project.createdBy.id !== session?.user.userId) return null;

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
                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8" disabled={status === "loading"}>
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