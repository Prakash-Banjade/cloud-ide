import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/layout/footer";
import MaintenanceNotice from "./notice";

export default function LandingPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <MaintenanceNotice />
            <Navbar />
            {children}
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    )
}