import React from 'react'
import Navbar from './navbar'

type Props = {
    children: React.ReactNode
}

export default function AppLayout({ children }: Props) {
    return (
        <div>
            <Navbar />
            <main className='container mx-auto mt-10'>
                {children}
            </main>
        </div>
    )
}