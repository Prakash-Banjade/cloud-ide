"use client";

import { useAxiosPrivate } from "@/hooks/useAxios";
import { QueryKey } from "@/lib/query-keys";
import { getErrMsg } from "@/lib/utils";
import { EPasskeyChallengeType } from "@/types";
import { startAuthentication } from "@simplewebauthn/browser";
import { KeyRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import LoadingButton from "../loading-button";

type Props = {
    setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ConfirmByPasskey({ setIsVerified }: Props) {
    const axios = useAxiosPrivate();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState<boolean>(false);
    const { data } = useSession();
    const [loadingText, setLoadingText] = useState<string>('Requesting...')

    const handleLoginWithPassKey = async () => {
        setError(null);
        setIsPending(true);
        try {
            const response = await axios.post(`/${QueryKey.WEB_AUTHN}/auth-challenge`, {
                email: data?.user.email,
                type: EPasskeyChallengeType.Sudo,
            });

            const challengePayload = response.data?.challengePayload;

            if (!challengePayload) throw new Error('Something seems wrong. Please try again.');

            try {
                setLoadingText('Waiting for input from browser interaction...');
                const authenticationResponse = await startAuthentication({ optionsJSON: challengePayload });
                setLoadingText('Verifying...');

                const res = await axios.post(`/${QueryKey.WEB_AUTHN}/verify-sudo`, {
                    authenticationResponse,
                });

                if (res.data?.verified === true) {
                    setIsVerified(true);
                } else {
                    throw new Error('Something seems wrong. Please try again.')
                }

            } catch (e) {
                if (e instanceof Error) {
                    if (e.message.includes('timed out')) {
                        setError('Authentication cancelled or timeout.')
                    } else {
                        setError(e.message)
                    }
                };
                setError(getErrMsg(e) ?? 'Something went wrong. Please try again.');
            }

        } catch (e) {
            setError(getErrMsg(e) || 'Something seems wrong. Please try again.')
        } finally {
            setIsPending(false);
            setLoadingText('Requesting...');
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <KeyRound className="w-8 h-8 text-muted-foreground" />
            <h2 className="text-xl">Passkey</h2>
            <p className="text-sm text-muted-foreground">
                When you are ready, authenticate using the button below.
            </p>
            <LoadingButton
                type="button"
                isLoading={isPending}
                loadingText={loadingText}
                onClick={handleLoginWithPassKey}
                className="w-full"
                disabled={isPending}
            >
                Use passkey
            </LoadingButton>
            {
                error && <p className="text-sm text-destructive">{error}</p>
            }
        </div>
    )
}