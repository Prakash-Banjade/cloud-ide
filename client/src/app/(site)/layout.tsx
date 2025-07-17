import Navbar from "@/components/landing-page/navbar";
import Footer from "@/components/layout/footer";

export default function LandingPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="pt-16">
                {children}
            </div>
            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    )
}