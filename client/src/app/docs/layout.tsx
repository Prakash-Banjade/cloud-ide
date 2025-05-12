import AppLayout from "@/components/layout/app-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Docs',
    description: 'Docs',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    )
}