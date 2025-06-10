import { getServerSession } from "next-auth";
import AuthSideView from "./components/auth-side-view";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (session) return redirect("/workspace");
    
    return (
        <div
            className="relative min-h-screen md:grid lg:grid-cols-2 lg:px-0 min-w-full"
        >
            <AuthSideView />
            {children}
        </div>
    )
}