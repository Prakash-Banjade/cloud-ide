import { serverFetch } from "@/lib/axios-server";
import { redirect } from "next/navigation";
import { TProjectsResponse } from "@/types";
import ProjectCard from "./project-card-item";
import ProjectListItem from "./project-list-item";
import { WorkspacePageProps } from "../page";
import { createQueryString } from "@/lib/utils";
import { FolderPlus, Search } from "lucide-react";
import CreateProjectButton from "./create-project-button";

type Props = {
    searchParams: WorkspacePageProps["searchParams"]
}

export default async function MyProjectsList(props: { searchParams: Promise<Props["searchParams"]> }) {
    const searchParams = await props.searchParams;

    const queryString = createQueryString({
        q: searchParams.q,
        language: searchParams.language,
        sortBy: searchParams.sortBy,
        order: searchParams.order
    });

    const res = await serverFetch(queryString.length > 0 ? `/projects?${queryString}` : "/projects");

    if (!res.ok) redirect("/auth/login");

    const projects: TProjectsResponse = await res.json();

    const view = searchParams.view || "grid";

    if (projects.data.length === 0 && queryString.length > 0) return <NoProjectsFound />;

    if (projects.data.length === 0) return <NoProjectsCreated />

    return (
        <section>
            {
                view === "grid"
                    ? <GridView projects={projects} />
                    : <ListView projects={projects} />
            }
        </section>
    )
}

function GridView({ projects }: { projects: TProjectsResponse }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
                projects.data.map(project => {
                    return (
                        <ProjectCard key={project.id} project={project} />
                    )
                })
            }
        </div>
    )
}

function ListView({ projects }: { projects: TProjectsResponse }) {
    return (
        <div className="space-y-6">
            {
                projects.data.map(project => {
                    return (
                        <ProjectListItem key={project.id} project={project} />
                    )
                })
            }
        </div>
    )
}

function NoProjectsFound() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-6">
                <Search className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matching projects found</h3>
            <p className="text-muted-foreground max-w-md mb-6 text-sm">
                We couldn't find any projects matching your current filters. Please try again with different filters
            </p>
        </div>
    )
}

function NoProjectsCreated() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border rounded-lg">
            <div className="bg-primary/10 rounded-full p-6 mb-6">
                <FolderPlus className="size-8 text-primary" />
            </div>

            <h3 className="text-lg font-semibold mb-3">You haven't created any project yet</h3>

            <p className="text-muted-foreground mb-8 max-w-md text-sm">
                Create your first project to start coding in the cloud with Qubide
            </p>

            <CreateProjectButton />
        </div>
    )
}