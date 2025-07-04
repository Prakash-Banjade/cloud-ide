import { Suspense } from "react"
import { ELanguage } from "@/types"
import CreateProjectButton from "@/components/workspace/create-project-button"
import ProjectsSearch from "@/components/workspace/projects-search"
import { CardsSkeleton } from "@/components/workspace/projects-skeleton"
import MyProjectsList from "@/components/workspace/projects-list"

export type WorkspacePageProps = {
    searchParams: {
        q?: string,
        language?: ELanguage,
        sortBy?: string
        view: 'grid' | 'list',
        order?: 'ASC' | 'DESC'
    }
}

export default async function WorkspacePage(props: { searchParams: Promise<WorkspacePageProps["searchParams"]> }) {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">My Workspace</h1>
                <CreateProjectButton />
            </header>

            <Suspense fallback={<div>Loading...</div>}>
                <ProjectsSearch />
            </Suspense>

            <Suspense fallback={<CardsSkeleton />}>
                <MyProjectsList searchParams={props.searchParams} />
            </Suspense>
        </div>
    )
}