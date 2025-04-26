"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CodingEventsContextType {
    isSyncing: boolean;
    setIsSyncing: (value: boolean) => void;
}

const CodingEventsContext = createContext<CodingEventsContextType | undefined>(undefined);

interface CodingEventsProviderProps {
    children: ReactNode;
}

export function CodingEventsProvider({ children }: CodingEventsProviderProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    const value = {
        isSyncing,
        setIsSyncing,
    };

    return (
        <CodingEventsContext.Provider value={value}>
            {children}
        </CodingEventsContext.Provider>
    );
}

export function useCodingEvents() {
    const context = useContext(CodingEventsContext);
    if (context === undefined) {
        throw new Error('useCodingEvents must be used within a CodingEventsProvider');
    }
    return context;
}
