import Logo from '../logo'
import Link from 'next/link'
import { ThemeToggle } from '../theme-toggle'

export default function Footer() {
    return (
        <footer className='relative border-t bg-card/50 py-4 flex items-center justify-center'>
            <section className='container mx-auto flex flex-col items-center justify-center gap-2'>
                <Link href="/">
                    <Logo height={30} width={30} />
                </Link>
                <p className='text-xs text-muted-foreground'>© {new Date().getFullYear()} Qubide</p>
            </section>
            <section className='absolute right-6'>
                <ThemeToggle />
            </section>
        </footer>
    )
}