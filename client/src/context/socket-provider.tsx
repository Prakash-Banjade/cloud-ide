"use client"

import { useFetchData } from '@/hooks/useFetchData';
import { QueryKey } from '@/lib/query-keys';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

    const runnerUrl = useMemo(() => {
        return process.env.NODE_ENV === "production"
            ? `wss://runner.${replId}.qubide.cloud`
            : "ws://localhost:3003"
    }, [replId]);

    const ptyUrl = useMemo(() => {
        return process.env.NODE_ENV === "production"
            ? `wss://pty.${replId}.qubide.cloud`
            : "ws://localhost:3004"
    }, [replId]);

    useEffect(() => {
        if (!replId || !data?.access_token) return;

        const runnerSocket = io(runnerUrl, {
            auth: {
                access_token: data.access_token,
            }
        });

        const ptySocket = io(ptyUrl, {
            auth: {
                access_token: data.access_token
            }
        });

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
