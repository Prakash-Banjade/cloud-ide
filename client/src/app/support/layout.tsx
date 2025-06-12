import LandingPageLayout from "@/components/landing-page/landing-page.layout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Support',
    description: 'Get help with Qubide.',
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    return (
        <LandingPageLayout>
            <div className="container mx-auto">
                {children}
            </div>
        </LandingPageLayout>
    )
}