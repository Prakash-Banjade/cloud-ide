"use client"

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: parseInt(process.env.NEXT_PUBLIC_QUERY_STALE_TIME!),
            gcTime: parseInt(process.env.NEXT_PUBLIC_QUERY_GC_TIME!),
            // retry: parseInt(process.env.NEXT_PUBLIC_QUERY_RETRY!),
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});