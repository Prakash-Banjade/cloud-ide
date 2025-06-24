"use client"

import axiosClient from '@/lib/axios-client';
import { REFRESH_TOKEN_HEADER, SocketEvents } from '@/lib/CONSTANTS';
import { TLoginResponse } from '@/types';
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
    const { data } = useSession();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [ptySocket, setPtySocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!replId || !data) return;

        const runnerUrl = process.env.NODE_ENV === 'production'
            ? `wss://${replId}.prakashbanjade.com`
            : `ws://${replId}.prakashbanjade.com`

        const ptyUrl = process.env.NODE_ENV === 'production'
            ? `wss://pty.${replId}.prakashbanjade.com`
            : `ws://pty.${replId}.prakashbanjade.com`

        const runnerSocket = io(
            runnerUrl,
            {
                auth: {
                    access_token: data.backendTokens.access_token
                }
            }
        );

        runnerSocket.on(SocketEvents.TOKEN_EXPIRED, async () => {
            try {
                const res = await axiosClient.post<TLoginResponse>(
                    `/auth/refresh`,
                    {},
                    { headers: { [REFRESH_TOKEN_HEADER]: data?.backendTokens.refresh_token } }
                );
                const { access_token } = res.data;

                if (access_token) {
                    runnerSocket.auth = {
                        access_token
                    };
                    runnerSocket.connect();
                }

            } catch (e) {
                runnerSocket.disconnect();
            }
        })

        const ptySocket = io(
            ptyUrl,
            {
                auth: {
                    access_token: data.backendTokens.access_token
                }
            }
        );

        setSocket(runnerSocket);
        setPtySocket(ptySocket);

        return () => {
            runnerSocket.off(SocketEvents.TOKEN_EXPIRED);
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
