import { ThemeToggle } from '@/components/theme-toggle'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthSideView() {
    return (
        <>
            <div className="absolute right-4 top-4 md:right-8 md:top-8">
                <ThemeToggle />
            </div>
            <Link
                href="/auth/login"
                className="absolute left-4 top-4 md:left-8 md:top-8 z-20 flex items-center font-medium"
            >
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary mr-2">
                    <Image
                        src="/logo.png"
                        alt='Qubide Logo'
                        width={32}
                        height={32}
                        className='rounded-md'
                    />
                </div>
                <span className='text-background'>Qubide</span>
            </Link>
            <div
                className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex"
                style={{
                    backgroundImage: "linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0)), linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0)), url('/auth-bg.jpg')",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
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