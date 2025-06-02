import { useSocket } from "@/context/socket-provider";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

export default function useChokidar(socket: Socket | null) {
    useEffect(() => {
        if (!socket) return;

        console.log('hi there')

        socket.on('chokidar:file-added', (data: { path: string }) => {
            console.log('chokidar:file-added', data);
        });

        return () => {
            socket.off('chokidar:file-added');
        };
    }, [socket])
}