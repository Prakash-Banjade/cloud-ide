"use client"

import Link from 'next/link'
import { Button } from '../ui/button'
import { usePathname } from 'next/navigation'
import ProfileDropdown from './profile-dropdown'
import { ThemeToggle } from '../theme-toggle'
import Logo from '../logo'

export default function Navbar() {
    const pathname = usePathname();

    return (
        <section className='border-b h-20 flex items-center bg-card/50'>
            <section className='container py-4 mx-auto flex items-center gap-6'>
                <Link href="/">
                    <Logo />
                </Link>

                <nav>
                    <ul className='flex items-center gap-2'>
                        <li>
                            <Button asChild variant={pathname === "/workspace" ? "secondary" : "link"}>
                                <Link href="/workspace">Workspace</Link>
                            </Button>
                        </li>
                        <li>
                            <Button asChild variant={pathname === "/docs" ? "secondary" : "link"}>
                                <Link href="/docs">Documentation</Link>
                            </Button>
                        </li>
                    </ul>
                </nav>

                <section className='ml-auto flex items-center gap-4'>
                    <ThemeToggle />
                    <ProfileDropdown />
                </section>
            </section>
        </section>
    )
}