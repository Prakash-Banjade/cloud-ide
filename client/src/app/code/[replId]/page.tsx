import { redirect } from 'next/navigation';
import React from 'react'
import CodingPageClient from './components/coding-page-client';
import { CodingStatesProvider } from '@/context/coding-states-provider';

type Props = {
    replId: string;
}

export default async function CodePage({ params }: { params: Promise<Props> }) {
    const { replId } = await params;

    if (!replId) redirect('/');

    return (
        <CodingStatesProvider>
            <CodingPageClient />
        </CodingStatesProvider>
    )
}