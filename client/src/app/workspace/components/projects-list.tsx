import { serverFetch } from "@/lib/axios-server";
import { redirect } from "next/navigation";
import ProjectsSearch from "./projects-search";
import { TProjectsResponse } from "@/types";
import ProjectCard from "./project-card";

type Props = {}

export default async function MyProjectsList({ }: Props) {
    const res = await serverFetch("projects");

    if (!res.ok) redirect("/auth/login");

    const projects: TProjectsResponse = await res.json();

    return (
        <section>
            <ProjectsSearch />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {
                    projects.data.map(project => {
                        return (
                            <ProjectCard key={project.id} project={project} />
                        )
                    })
                }
            </div>

        </section>
    )
}