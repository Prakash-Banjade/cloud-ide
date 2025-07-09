"use client";

import { ReactNode, useMemo } from "react";
import { RoomProvider } from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { ClientSideSuspense } from "@liveblocks/react";

export function Room({ children }: { children: ReactNode }) {
    const params = useParams();

    return (
        <RoomProvider
            id={params.replId as string}
            initialPresence={{
                cursor: null,
            }}
        >
            <ClientSideSuspense fallback={<div>Loading liveblocks...</div>}>{children}</ClientSideSuspense>
        </RoomProvider>
    );
}