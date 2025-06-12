import Footer from "../layout/footer";
import Navbar from "./navbar";

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