import { useEffect, useState } from "react";
import { Socket, io } from 'socket.io-client';

export function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // const newSocket = io(`ws://${replId}.peetcode.com`);
        const newSocket = io(`ws://localhost:3003`);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}