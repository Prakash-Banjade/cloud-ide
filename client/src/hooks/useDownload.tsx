import { Button } from '@/components/ui/button';
import { CircleX } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import React from 'react'
import toast from 'react-hot-toast';

export default function useDownload() {
    const { data } = useSession();
    const { replId } = useParams();

    // const podUrl = "http://localhost:3003";
    const podUrl = process.env.NODE_ENV === 'production'
        ? `https://${replId}.prakashbanjade.com`
        : `http://${replId}.prakashbanjade.com`;

    async function handleDownload() {
        const res = await fetch(`${podUrl}/project/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${data?.backendTokens.access_token}`,
            },
        });
        if (!res.ok) {
            toast(() => (
                <div className="flex items-center">
                    <span className="self-start mr-1">
                        <CircleX size={22} className="fill-red-500 stroke-white" />
                    </span>
                    <span className="text-sm self-start">
                        Download Failed. Try reloading the page.
                    </span>
                    <Button size={'sm'} type="button" onClick={() => window.location.reload()}>
                        Reload
                    </Button>
                </div>
            ));
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${replId}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return handleDownload;
}