import axiosClient from '@/lib/axios-client';
import { QueryKey } from '@/lib/query-keys';
import { getErrMsg } from '@/lib/utils';
import { EPasskeyChallengeType, TLoginResponse } from '@/types/types';
import { startAuthentication } from '@simplewebauthn/browser';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react'
import toast from 'react-hot-toast';

type Props = {
    isExternalPending?: boolean;
    email: string;
}

export default function TwoFaPasskeyVerification({ isExternalPending, email }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState<string>('Validating email...')
    const [isPending, startTransition] = useTransition();

    const handleVerify = async () => {
        setError(null);
        setLoadingText('Validating email...');

        startTransition(async () => {
            try {
                const response = await axiosClient.post(`/${QueryKey.WEB_AUTHN}/auth-challenge`, {
                    email,
                    type: EPasskeyChallengeType.TwoFaVerify,
                });

                const challengePayload = response.data?.challengePayload;

                if (!challengePayload) throw new Error('Something seems wrong. Please try again.');

                try {
                    setLoadingText('Waiting for input from browser interaction...');
                    const authenticationResponse = await startAuthentication({ optionsJSON: challengePayload });
                    setLoadingText('Signing in...');

                    const response = await axiosClient.post<TLoginResponse>(`/${QueryKey.WEB_AUTHN}/verify-2fa`, {
                        authenticationResponse,
                        email,
                    });

                    const data = response.data;

                    if (!data) throw new Error('Something seems wrong. Please try again.');

                    if ('access_token' in response.data) {
                        const result = await signIn("credentials", {
                            ...data,
                            redirect: false,
                        });

                        if (result?.status === 401) {
                            toast.error("Invalid email or password");
                            return;
                        }

                        router.push("/workspace");
                        router.refresh();
                    }

                } catch (e) {
                    if (e instanceof Error) {
                        if (e.message.includes('timed out')) {
                            setError('Verification cancelled or timeout.')
                        } else {
                            setError(e.message)
                        }
                    };
                    setError(getErrMsg(e) ?? 'Something went wrong. Please try again.');
                }

            } catch (e) {
                setError(getErrMsg(e) || 'Something seems wrong. Please try again.')
            }
        })
    }

    return (
        <section>
            <button
                type="button"
                className="rounded-lg w-full flex flex-col gap-2 hover:bg-secondary transition-all px-4 py-5 disabled:cursor-not-allowed disabled:opacity-80"
                disabled={isPending || isExternalPending}
                onClick={handleVerify}
            >
                {
                    isPending
                        ? (
                            <>
                                <span className="flex items-center gap-4 font-medium">
                                    <LoaderCircle size={20} className='animate-spin' /> Using passkey
                                </span>
                                <span className="text-sm ml-10 text-left text-muted-foreground">
                                    {loadingText}
                                </span>
                            </>
                        )
                        : (
                            <>
                                <span className="flex items-center gap-4 font-medium">
                                    <KeyRound size={20} /> Use a passkey
                                </span>
                                <span className="text-sm ml-10 text-left text-muted-foreground">
                                    You have registered a passkey. You will be prompted to use it.
                                </span>
                            </>
                        )
                }
            </button>
            {
                !!error && (
                    <p className='mt-1 text-sm text-destructive'>{error}</p>
                )
            }
        </section>
    )
}