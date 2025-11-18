import { Suspense } from "react"
import { ELanguage } from "@/types/types"
import CreateProjectButton from "@/components/workspace/create-project-button"
import ProjectsSearch, { ProjectsListTabs } from "@/components/workspace/projects-search"
import { CardsSkeleton } from "@/components/workspace/projects-skeleton"
import MyProjectsList from "@/components/workspace/projects-list"

export type WorkspacePageProps = {
    searchParams: Promise<{
        q?: string,
        language?: ELanguage,
        sortBy?: string
        view: 'grid' | 'list',
        order?: 'ASC' | 'DESC',
        tab?: 'shared' | 'own'
    }>
}

export default async function WorkspacePage(props: WorkspacePageProps) {
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
                <ProjectsListTabs
                    projectList={<MyProjectsList searchParams={await props.searchParams} />}
                />
            </Suspense>
        </div>
    )
}