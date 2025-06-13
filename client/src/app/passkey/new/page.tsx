"use client";

import { School, UserCog } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { startRegistration } from '@simplewebauthn/browser';
import { useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getErrMsg } from '@/lib/utils';
import { useAxiosPrivate } from '@/hooks/useAxios';
import { useSession } from 'next-auth/react';
import { QueryKey } from '@/lib/query-keys';
import { useRouter } from 'next/navigation';
import LoadingButton from '@/components/loading-button';

export default function NewPassKeyPage() {
    const axios = useAxiosPrivate();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const { data } = useSession()
    const router = useRouter();
    const [loadingText, setLoadingText] = useState<string>('Prompting...')

    const handleAddPassKey = async () => {
        if (!data) return;

        setError(null);
        setIsPending(true);
        try {
            const response = await axios.post(`/${QueryKey.WEB_AUTHN}/register-challenge`);

            const challengePayload = response.data?.challengePayload;

            if (!challengePayload) throw new Error('Failed to register passkey'); // todo: show some error msg

            try {
                setLoadingText('Waiting for input from browser interaction...');
                const registrationResponse = await startRegistration({ optionsJSON: challengePayload });
                setLoadingText('Adding passkey...');

                const response = await axios.post(`/${QueryKey.WEB_AUTHN}/verify-register`, {
                    registrationResponse,
                });

                if (response.data?.message) {
                    toast.success(response.data.message);
                    queryClient.invalidateQueries({
                        queryKey: [QueryKey.WEB_AUTHN],
                    })
                    router.replace(`/settings?tab=password-and-authentication`);
                }

            } catch (e) {
                console.log(e)
                
                if (e instanceof Error) {
                    if (e.message.includes('timed out')) {
                        setError('Registration cancelled or timeout.')
                    } else {
                        setError(e.message)
                    }
                };

                console.log(11111)
                setError(getErrMsg(e) ?? 'Failed to register passkey');
            }
            
        } catch (e) {
            console.log(22222)
            setError(getErrMsg(e) ?? 'Failed to register passkey');
        } finally {
            setIsPending(false);
            setLoadingText('Prompting...');
        }
    }

    return (
        <div className="h-screen max-h-[1000px] flex items-center justify-center">
            <div className="w-full max-w-md space-y-6 p-4">
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground mx-auto">
                    <School className="size-8" />
                </div>
                <h1 className="text-2xl text-center font-light mb-4">
                    Configure passwordless authentication
                </h1>

                <Card className="p-8 bg-secondary/20">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <UserCog className="w-12 h-12" />

                        <h2 className="text-xl font-normal">Add a passkey</h2>

                        <p className="text-sm leading-relaxed">
                            Your device supports passkeys, a secure alternative to passwords that uses touch,
                            facial recognition, your device password, or a PIN to verify your identity.
                        </p>

                        <p className="text-sm leading-relaxed">
                            Passkeys offer a simple and secure way to sign in,
                            replacing your password and two-factor authentication credentials.
                        </p>

                        <section className="w-full mt-2">
                            <LoadingButton
                                type="button"
                                isLoading={isPending}
                                loadingText={loadingText}
                                onClick={handleAddPassKey}
                                disabled={isPending}
                                className='w-full'
                            >
                                Add passkey
                            </LoadingButton>

                            {
                                error && (
                                    <p className="text-sm text-destructive mt-1">{error}</p>
                                )
                            }
                        </section>

                        <Button
                            variant={'ghost'}
                            className="w-full"
                            onClick={() => router.replace(`/settings?tab=password-and-authentication`)}
                        >
                            Cancel
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}