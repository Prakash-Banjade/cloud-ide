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
                responseType: "blob",
                withCredentials: undefined
            });

            // create URL for the blob and trigger download
            const url = window.URL.createObjectURL(response.data);
            const disposition = response.headers['content-disposition'] || '';
            let filename = replId + '.zip';

            // try to extract filename from header if available
            const match = disposition.match(/filename="?(.+?)"?($|;)/);
            if (match) filename = match[1];

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.remove();
        } catch (error) {
            console.log(error)
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