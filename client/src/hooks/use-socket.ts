import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Socket, io } from 'socket.io-client';

export function useSocket() {
    const params = useParams();
    const { replId } = params;

    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!replId) return;
        // const newSocket = io(`ws://${replId}.peetcode.com`);
        console.log(1, "from useSocket")
        const newSocket = io(`ws://127.0.0.1:3003`);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}