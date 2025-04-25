"use client"

import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";
import { useAppMutation } from "@/hooks/useAppMutation";
import { File, ItemType, RemoteFile } from "@/lib/file-manager";
import { ORCHESTRATOR_URL } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeEditor } from "./editor/editor";

export default function CodingPageClient() {
    const params = useParams();

    const { mutateAsync, isPending } = useAppMutation();

    useEffect(() => {
        const startResources = async () => {
            await mutateAsync({
                endpoint: `${ORCHESTRATOR_URL}/start`,
                method: 'post',
                data: { replId: params.replId }
            });
        }

        startResources();
    }, []);

    if (isPending) {
        return <div>Booting...</div>
    }

    return <CodingPagePostPodCreation />
}

export const CodingPagePostPodCreation = () => {
    const params = useParams();
    const replId = params.replId ?? '';

    const socket = useSocket("node-node"); // hardcoded for now

    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[] }) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
        }
    }, [socket]);

    const onSelect = (file: File) => {
        if (file.type === ItemType.DIRECTORY) {
            socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
                setFileStructure(prev => {
                    const allFiles = [...prev, ...data];
                    return allFiles.filter((file, index, self) =>
                        index === self.findIndex(f => f.path === file.path)
                    );
                });
            });
        } else {
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data;
                setSelectedFile(file);
            });
        }
    };

    if (!loaded) {
        return "Loading...";
    }

    if (!socket) return null;

    return (
        <section className="h-screen">
            <Button onClick={() => setShowOutput(!showOutput)}>See output</Button>
            <section className="flex w-full">
                <div>
                    <CodeEditor socket={socket} selectedFile={selectedFile} onSelect={onSelect} files={fileStructure} />
                </div>
                <div>
                    {/* {showOutput && <Output />}
                    <Terminal socket={socket} /> */}
                </div>
            </section>
        </section>
    );
}