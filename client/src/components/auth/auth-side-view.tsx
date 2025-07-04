import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import Logo from '@/components/logo'

export default function AuthSideView() {
    return (
        <>
            <div className="absolute right-4 top-4 md:right-8 md:top-8">
                <ThemeToggle />
            </div>
            <Link
                href="/"
                className="absolute left-4 top-4 md:left-8 md:top-8 z-20 flex items-center font-medium"
            >
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
                    <Logo />
                </div>
            </Link>
            <div
                className="relative bg-[url('/auth-bg-light.png')] dark:bg-[url('/auth-bg-dark.png')] hidden h-full flex-col bg-muted p-10 lg:flex"
                style={{
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div
                    className="relative z-20 mt-auto"
                >
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Fully browser-based coding platform, accessible anywhere, supports many languages.&rdquo;
                        </p>
                        <footer className="text-sm">Made by Qubide Team</footer>
                    </blockquote>
                </div>
            </div>
        </>
    )
}