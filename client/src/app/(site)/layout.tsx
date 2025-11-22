import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/layout/footer";
import MaintenanceNotice from "./notice";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LandingPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <ScrollArea className="h-screen overflow-y-auto">
            <div className="min-h-screen flex flex-col">
                <MaintenanceNotice />
                <Navbar />
                {children}
                <div className="mt-auto">
                    <Footer />
                </div>
            </div>
        </ScrollArea>
    )
}