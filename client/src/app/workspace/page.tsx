import MyProjectsList from "./components/projects-list"
import CreateProjectButton from "./components/create-project-button"
import { Suspense } from "react"
import { CardsSkeleton } from "./components/projects-skeleton"
import ProjectsSearch from "./components/projects-search"
import { ELanguage } from "@/types"

export type WorkspacePageProps = {
    searchParams: {
        q?: string,
        language?: ELanguage,
        sort?: string
        view: 'grid' | 'list'
    }
}

export default async function WorkspacePage(props: Promise<WorkspacePageProps>) {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">My Workspace</h1>
                <CreateProjectButton />
            </header>

            <ProjectsSearch />

            <Suspense fallback={<CardsSkeleton />}>
                <MyProjectsList {...props} />
            </Suspense>
        </div>
    )
}