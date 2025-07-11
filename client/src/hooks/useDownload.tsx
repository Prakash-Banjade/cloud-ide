import { Button } from '@/components/ui/button';
import { CircleX } from 'lucide-react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAxiosPrivate } from './useAxios';

export default function useDownload() {
    const { replId } = useParams();
    const axios = useAxiosPrivate();

    // const podUrl = "http://localhost:3003";
    const podUrl = process.env.NODE_ENV === 'production'
        ? `https://${replId}.prakashbanjade.com`
        : `http://${replId}.prakashbanjade.com`;

    async function handleDownload() {
        try {
            const response = await axios.get(`${podUrl}/project/download`, {
                withCredentials: undefined
            });

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = `${replId}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

        } catch (error) {
            toast(() => (
                <div className="flex items-center">
                    <span className="self-start mr-1">
                        <CircleX size={22} className="fill-red-500 stroke-white" />
                    </span>
                    <span className="text-sm self-start">
                        Download Failed. Try reloading the page.
                    </span>
                    <Button size="sm" type="button" onClick={() => window.location.reload()}>
                        Reload
                    </Button>
                </div>
            ));
        }
    }


    return handleDownload;
}