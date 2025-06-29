import { CircleCheckBig, LoaderCircle } from "lucide-react"

type Props = {
    state: 'booting' | 'loading_project' | 'setup'
}

export default function CodingPageLoader({ state }: Props) {

    return (
        <div className="flex items-center justify-center h-screen">
            {
                state === 'booting'
                    ? (
                        <section className="space-y-3 min-w-[300px]">
                            <div className="flex items-center gap-2">
                                <LoaderCircle size={20} className="animate-spin" />
                                <span>Booting your project...</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-5"></div>
                                <span className="text-muted-foreground">Loading project data</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-5"></div>
                                <span className="text-muted-foreground">Setting up the environment</span>
                            </div>
                        </section>
                    ) : state === 'loading_project' ? (
                        <section className="space-y-3 min-w-[300px]">
                            <div className="flex items-center gap-2">
                                <CircleCheckBig size={20} className="text-green-500" />
                                <span>Boot Success</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <LoaderCircle size={20} className="animate-spin" />
                                <span>Project loading...</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-5"></div>
                                <span className="text-muted-foreground">Setting up the environment</span>
                            </div>
                        </section>
                    ) : state === 'setup' ? (
                        <section className="space-y-3 min-w-[300px]">
                            <div className="flex items-center gap-2">
                                <CircleCheckBig size={20} className="text-green-500" />
                                <span>Boot Success</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CircleCheckBig size={20} className="text-green-500" />
                                <span>Project Loaded</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <LoaderCircle size={20} className="animate-spin" />
                                <span>Setting up the environment...</span>
                            </div>
                        </section>
                    ) : null
            }
        </div>
    )
}