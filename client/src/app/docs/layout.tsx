import LandingPageLayout from "@/components/landing-page/landing-page.layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Docs',
    description: 'Read our documentation for more information about Qubide.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <LandingPageLayout>
            <div className="container mx-auto">
                {children}
            </div>
        </LandingPageLayout>
    )
}