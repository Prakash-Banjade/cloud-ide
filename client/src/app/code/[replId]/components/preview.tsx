import { ArrowLeft, ArrowRight, ExternalLink, RotateCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRef } from 'react';

export default function Preview() {
    const params = useParams();
    const replId = params.replId ?? '';

    const previewRef = useRef<HTMLIFrameElement>(null);
    const link = `http://${replId}.qubide.cloud`;

    // const goBack = () => previewRef.current?.contentWindow?.history.back();
    // const goForward = () => previewRef.current?.contentWindow?.history.forward();
    const reload = () => previewRef.current?.contentWindow?.postMessage('reload', link);


    // const previewUrl = `/preview/${replId}`;

    return (
        <section className='flex flex-col h-full'>
            <div className="flex gap-2 p-1 bg-sidebar">
                <button title='Go back'><ArrowLeft size={16} /></button>
                <button title='Go forward'><ArrowRight size={16} /></button>
                <button title='Reload' onClick={reload}><RotateCw size={16} /></button>
                <div className="grow">
                    <input
                        type="text"
                        value={link}
                        className='text-xs w-full p-2 py-1.5 rounded-md border border-input'
                        readOnly
                        disabled
                    />
                </div>

                <button onClick={() => window.open(link, '_blank')} title='Open in new tab'><ExternalLink size={16} /></button>
            </div>
            <iframe
                ref={previewRef}
                width={"100%"}
                height={"100%"}
                className='grow'
                src={link}
                sandbox="allow-scripts allow-forms allow-same-origin"
                title="Live Preview"
            />
        </section>
    )
}