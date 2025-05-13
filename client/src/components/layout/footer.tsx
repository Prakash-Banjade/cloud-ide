import React from 'react'
import Logo from '../logo'
import Link from 'next/link'

type Props = {}

export default function Footer({ }: Props) {
    return (
        <footer className='border-t bg-card/50 py-4'>
            <section className='container mx-auto flex flex-col items-center justify-center gap-2'>
                <Link href="/">
                    <Logo height={30} width={30} />
                </Link>
                <p className='text-xs text-muted-foreground'>© {new Date().getFullYear()} Qubide</p>
            </section>
        </footer>
    )
}