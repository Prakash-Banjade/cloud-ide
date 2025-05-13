import { format, formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Code, Calendar, Clock, MoreVertical, ExternalLink, Copy, Trash, Edit } from "lucide-react"
import { TProject } from "@/types"
import Link from "next/link"
import { languageFields } from "@/lib/utils"

interface ProjectCardProps {
    project: TProject
}

const formatDate = (dateString: string) => {
    return formatDistanceToNow(dateString, { addSuffix: true })
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const language = languageFields.find((field) => field.value === project.language);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent>
                <div className="flex justify-between items-start">
                    <Link href={`/code/${project.replId}`}>
                        <h3 className="font-semibold text-lg line-clamp-1 hover:underline">{project.name}</h3>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Trash className="text-destructive" />
                                <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Code className="mr-2 h-4 w-4" />
                        <span className="mr-2">Language:</span>
                        {
                            language?.label
                        }
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span className="mr-2">Created:</span>
                        {format(project.createdAt, "MMM dd, yyyy")}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span className="mr-2">Last Updated:</span>
                        {formatDate(project.updatedAt)}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground truncate">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {project.replId}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                {language?.icon && <language.icon className="size-8" />}

                <Button size="sm" asChild>
                    <Link href={`/code/${project.replId}`}>
                        <ExternalLink />
                        Open
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
