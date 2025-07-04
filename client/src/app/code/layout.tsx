import CodingPageLoader from '@/components/code/coding-page-loader'
import { Metadata } from 'next'
import React, { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Code',
    description: 'Code',
}

export default async function CodeLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<CodingPageLoader state="booting" />}>
            {children}
        </Suspense>
    )
}