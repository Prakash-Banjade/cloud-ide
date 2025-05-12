import AppLayout from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Workspace',
    description: 'Workspace',
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    )
}