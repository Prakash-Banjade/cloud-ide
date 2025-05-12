import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: 'Code',
    description: 'Code',
}

export default async function CodeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            {children}
        </div>
    )
}