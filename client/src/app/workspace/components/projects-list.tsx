import { serverFetch } from "@/lib/axios-server";
import { redirect } from "next/navigation";
import { TProjectsResponse } from "@/types";
import ProjectCard from "./project-card-item";
import ProjectListItem from "./project-list-item";
import { WorkspacePageProps } from "../page";
import { createQueryString } from "@/lib/utils";

type Props = {
    searchParams: WorkspacePageProps["searchParams"]
}

export default async function MyProjectsList(props: Promise<Props>) {
    const { searchParams } = await props;

    const queryString = createQueryString({
        q: searchParams.q,
        language: searchParams.language,
        sort: searchParams.sort,
    });

    const res = await serverFetch(queryString.length > 0 ? `/projects?${queryString}` : "/projects");

    if (!res.ok) redirect("/auth/login");

    const projects: TProjectsResponse = await res.json();

    const view = searchParams.view || "grid";

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