import AuthSideView from "./components/auth-side-view";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="relative min-h-screen md:grid lg:grid-cols-2 lg:px-0 min-w-full"
        >
            <AuthSideView />
            {children}
        </div>
    )
}