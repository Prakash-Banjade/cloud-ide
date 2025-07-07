import { format, formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Code, Calendar, Clock, MoreVertical, ExternalLink, Trash, Edit } from "lucide-react"
import { TProject } from "@/types/types"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { languageFields } from "@/lib/utils"
import ProjectCardActions from "./project-card-actions"

interface ProjectListItemProps {
    project: TProject
}

export default function ProjectListItem({ project }: ProjectListItemProps) {
    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    }

    const language = languageFields.find((field) => field.value === project.language);

    return (
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all">
            <div className="flex-1 min-w-0 mb-4 sm:mb-0 sm:mr-4">
                <header className="flex items-center gap-1">
                    <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {project.replId}
                    </span>
                </header>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Created {format(project.createdAt, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Last opened {formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="flex items-center">
                        <Code className="mr-1 h-3 w-3" />
                        {language?.label}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button size="sm" asChild>
                    <Link href={`/code/${project.replId}`}>
                        <ExternalLink />
                        Open
                    </Link>
                </Button>

                <ProjectCardActions project={project} />
            </div>
        </Card>
    )
}
