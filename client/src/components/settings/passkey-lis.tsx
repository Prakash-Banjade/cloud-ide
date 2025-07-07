"use client";

import { Separator } from "@/components/ui/separator"
import { KeyRound } from "lucide-react"
import React from "react"
import { formatDistanceToNow, isToday } from "date-fns"
import { useFetchData } from "@/hooks/useFetchData"
import { TWebAuthnCredential } from "@/types/types"
import { QueryKey } from "@/lib/query-keys"
import EditPassKeyBtn from "./edit-passkey-btn"
import DeletePassKeyBtn from "./delete-passkey-btn"
import { Skeleton } from "@/components/ui/skeleton"

export default function PassKeysList() {
    const { data: credentials, isLoading } = useFetchData<TWebAuthnCredential[]>({
        queryKey: [QueryKey.WEB_AUTHN],
        endpoint: QueryKey.WEB_AUTHN,
    });

    if (isLoading) return <PasskeysListLoading />;

    if (!credentials?.length) return <div className="mt-10 text-sm text-muted-foreground font-semibold">You currently don&apos;t have any passkeys registered.</div>;

    return (
        <div className="space-y-px mt-6 border rounded-md overflow-hidden">
            {credentials?.map((cred, ind) => {
                const lastUsed = cred.lastUsed;
                let lastUsedString = lastUsed && (
                    isToday(new Date(lastUsed))
                        ? `${formatDistanceToNow(new Date(lastUsed))} ago`
                        : new Date(lastUsed).toDateString()
                );

                return (
                    <React.Fragment key={cred.id}>
                        <div className="flex items-center justify-between p-4 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                    <KeyRound className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-medium ">
                                            {cred.name}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Added on {new Date(cred.createdAt).toDateString()} | Last used {lastUsedString || 'Never'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <EditPassKeyBtn credentialId={cred.id} defaultName={cred.name} />
                                <DeletePassKeyBtn credentialId={cred.id} />
                            </div>
                        </div>

                        {
                            ind !== credentials?.length - 1 && (
                                <Separator />
                            )
                        }
                    </React.Fragment>
                )
            })}
        </div>
    )
}


function PasskeysListLoading() {
    return (
        <section className="mt-6">
            <div className="flex items-start justify-between p-4 bg-background border rounded-lg rounded-b-none">
                <div className="flex gap-4">
                    <div className="mt-1 text-muted-foreground">
                        <Skeleton className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>
            <div className="flex items-start justify-between p-4 bg-background border rounded-lg border-t-0 rounded-t-none">
                <div className="flex gap-4">
                    <div className="mt-1 text-muted-foreground">
                        <Skeleton className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>
        </section>
    )
}

