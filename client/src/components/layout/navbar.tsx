"use client"

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import { usePathname } from 'next/navigation'
import ProfileDropdown from './profile-dropdown'

type Props = {}

export default function Navbar({ }: Props) {
    const pathname = usePathname();

    return (
        <section className='border-b h-20'>
            <section className='container py-4 mx-auto flex items-center gap-6'>
                <section>
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={40}
                        height={40}
                        className='rounded-md'
                    />
                </section>

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

                <section className='ml-auto'>
                    <ProfileDropdown />
                </section>
            </section>
        </section>
    )
}