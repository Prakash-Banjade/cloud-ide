import { Button } from "@/components/ui/button";
import { CircleX, Download, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function DownloadButton() {
    const { data } = useSession();
    const { replId } = useParams();

    // const podUrl = "http://localhost:3003";
    const podUrl = `http://${replId}.prakashbanjade.com`;

    async function handleDownload() {
        const res = await fetch(`${podUrl}/project/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${data?.backendTokens.access_token}`,
            },
        });
        if (!res.ok) {
            toast((t) => (
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


    return (
        <Button
            variant={'outline'}
            type="button"
            onClick={handleDownload}
        >
            <Download />
            Download
        </Button>
    )
}