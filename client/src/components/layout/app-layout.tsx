import React from 'react'
import Navbar from './navbar'
import Footer from './footer'

type Props = {
    children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
    return (
        <div className='min-h-screen flex flex-col'>
            <Navbar />
            <main className='container mx-auto my-10 mb-40'>
                {children}
            </main>
            <section className='mt-auto'>
                <Footer />
            </section>
        </div>
    )
}