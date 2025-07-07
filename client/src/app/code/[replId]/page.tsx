import { redirect } from 'next/navigation';
import React from 'react'
import CodingPageClient from '@/components/code/coding-page-client';
import { serverFetch } from '@/lib/axios-server';

type Props = {
    params: Promise<{ replId: string }>
}

export default async function CodePage({ params }: Props) {
    const { replId } = await params;

    const res = await serverFetch(`/projects/start?replId=${replId}`, {
        method: 'POST',
    });

    if (!res.ok) {
        console.log(res);
        redirect('/workspace');
    };

    return (
        <CodingPageClient />
    )
}