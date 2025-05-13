import React from 'react'
import Navbar from './navbar'
import Footer from './footer'

type Props = {
    children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
    return (
        <div>
            <Navbar />
            <main className='container mx-auto my-10 mb-32'>
                {children}
            </main>
            <Footer />
        </div>
    )
}