"use client"

import { useFetchData } from '@/hooks/useFetchData';
import { QueryKey } from '@/lib/query-keys';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    ptySocket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const params = useParams();
    const { replId } = params;
    const { status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [ptySocket, setPtySocket] = useState<Socket | null>(null);

    const { data } = useFetchData<{ access_token: string }>({ // this access_token contains
        endpoint: QueryKey.PROJECTS + '/token' + `?replId=${replId}`,
        queryKey: [QueryKey.PROJECTS, 'token', replId as string],
        options: {
            enabled: !!replId && status === 'authenticated'
        }
    });

    useEffect(() => {
        if (!replId || !data?.access_token) return;

        const runnerUrl = process.env.NODE_ENV === 'production'
            ? `wss://${replId}.prakashbanjade.com`
            : `ws://${replId}.prakashbanjade.com`

        const ptyUrl = process.env.NODE_ENV === 'production'
            ? `wss://pty.${replId}.prakashbanjade.com`
            : `ws://pty.${replId}.prakashbanjade.com`

        const runnerSocket = io(
            runnerUrl,
            // "ws://localhost:3003",
            {
                auth: {
                    access_token: data.access_token,
                }
            }
        );

        const ptySocket = io(
            ptyUrl,
            // "ws://localhost:3004",
            {
                auth: {
                    access_token: data.access_token
                }
            }
        );

        setSocket(runnerSocket);
        setPtySocket(ptySocket);

        return () => {
            runnerSocket.disconnect();
            ptySocket.disconnect();
        };
    }, [replId, data]);

    return (
        <SocketContext.Provider value={{ socket, ptySocket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
