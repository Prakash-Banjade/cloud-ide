import { ArrowLeft, ArrowRight, ExternalLink, LoaderCircle, RotateCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function Preview() {
    const params = useParams();
    const replId = params.replId ?? '';

    const previewRef = useRef<HTMLIFrameElement>(null);
    const link = `https://${replId}.qubide.cloud`;

    const [isServerReady, setIsServerReady] = useState(false);
    const [key, setKey] = useState(0); // forces iframe reload

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkServer = async () => {
            try {
                const res = await fetch(link, {
                    method: "GET",
                });

                if (res.status !== 502) {
                    // If server responds, it's likely ready
                    setIsServerReady(true);
                    clearInterval(intervalId);
                    setKey(prev => prev + 1); // refresh iframe
                }

            } catch (err) {
                // server not ready yet
            }
        };

        intervalId = setInterval(checkServer, 2000); // poll every 2 seconds

        return () => clearInterval(intervalId);
    }, [replId]);

    // const goBack = () => previewRef.current?.contentWindow?.history.back();
    // const goForward = () => previewRef.current?.contentWindow?.history.forward();
    const reload = () => previewRef.current?.contentWindow?.location.reload();

    return (
        <section className='flex flex-col h-full'>
            <div className="flex gap-2 p-1 px-2 bg-sidebar">
                <button title='Go back'><ArrowLeft size={16} /></button>
                <button title='Go forward'><ArrowRight size={16} /></button>
                <button title='Reload' onClick={reload}><RotateCw size={16} /></button>
                <div className="grow">
                    <input
                        type="text"
                        value={link}
                        className='text-xs w-full px-2.5 py-1.5 rounded-md border border-input'
                        readOnly
                        disabled
                    />
                </div>

                <button onClick={() => window.open(link, '_blank')} title='Open in new tab'><ExternalLink size={16} /></button>
            </div>
            {
                !isServerReady ? (
                    <div className='h-full flex flex-col items-center justify-center gap-3'>
                        <LoaderCircle className="animate-spin" />
                        <p className='text-center text-sm'>Please wait for the preview to load</p>
                    </div>
                ) : (
                    <iframe
                        key={key}
                        ref={previewRef}
                        width={"100%"}
                        height={"100%"}
                        className='grow'
                        src={link}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                        title="Live Preview"
                    />
                )
            }
        </section>
    )
}