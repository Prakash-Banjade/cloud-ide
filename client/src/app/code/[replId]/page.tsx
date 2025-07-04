import { redirect } from 'next/navigation';
import React from 'react'
import { API_URL } from '@/lib/utils';
import { auth } from '@/lib/auth';
import CodingPageClient from '@/components/code/coding-page-client';

type Props = {
    replId: string;
}

export default async function CodePage({ params }: { params: Promise<Props> }) {
    const { replId } = await params;

    const session = await auth();

    const res = await fetch(`${API_URL}/projects/start?replId=${replId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.backendTokens.access_token}`,
        },
    });

    if (!res.ok) {
        console.log(res);
        redirect('/workspace');
    };

    return (
        <CodingPageClient />
    )
}