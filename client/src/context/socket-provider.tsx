"use client"

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
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

    useEffect(() => {
        if (!replId || !data) return;

        const newSocket = io(
            // `ws://127.0.0.1:3003`,
            `ws://${replId}.prakashbanjade.com`,
            {
                auth: {
                    access_token: data.backendTokens.access_token
                }
            }
        );
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId, data]);

    return (
        <SocketContext.Provider value={{ socket }}>
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
