import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NewProjectForm } from "./components/new-project-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import MyProjectsList from "./components/projects-list"

export default function WorkspacePage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold">My Workspace</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new App</DialogTitle>
                        </DialogHeader>
                        <NewProjectForm />
                    </DialogContent>
                </Dialog>
            </header>

            <MyProjectsList />
        </div>
    )
}