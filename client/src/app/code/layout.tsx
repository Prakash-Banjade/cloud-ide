import { Metadata } from 'next'
import React, { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Code',
    description: 'Code',
}

export default async function CodeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Suspense fallback={<div>Booting your repl...</div>}>
                {children}
            </Suspense>
        </div>
    )
}