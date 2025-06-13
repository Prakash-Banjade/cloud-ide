import axiosClient from '@/lib/axios-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { startAuthentication } from '@simplewebauthn/browser';
import { AxiosError } from 'axios';
import { KeyRound } from 'lucide-react';
import React, { useEffect, useState, useTransition } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import LoadingButton from '@/components/loading-button';
import { signIn } from 'next-auth/react';
import { webauthnVerifyLogin } from '@/lib/actions/login.action';
import { useRouter } from 'next/navigation';

type Props = {
    setIsFormSubmitting: React.Dispatch<React.SetStateAction<boolean>>
}

const loginFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});

type loginFormSchemaType = z.infer<typeof loginFormSchema>;

export default function LoginByPasskeyForm({ setIsFormSubmitting }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState<string>('Validating email...')
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<loginFormSchemaType>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit({ email }: loginFormSchemaType) {
        setError(null);

        startTransition(async () => {
            try {
                const response = await axiosClient.post(`/web-authn/auth-challenge`, {
                    email: form.getValues('email')
                });

                const challengePayload = response.data?.challengePayload;

                if (!challengePayload) throw new Error('Failed to login with passkey');

                try {
                    setLoadingText('Waiting for input from browser interaction...');
                    const authenticationResponse = await startAuthentication({ optionsJSON: challengePayload });
                    setLoadingText('Signing in...');

                    const data = await webauthnVerifyLogin(authenticationResponse, email);

                    if (data.access_token) {
                        const res = await signIn("credentials", {
                            ...data,
                            redirect: false,
                        });

                        if (res?.status === 401) {
                            setErrorMsg("Unable to sign in", setError, form)
                        }

                        router.replace("/workspace");
                        router.refresh();
                    }

                } catch (e) {
                    setErrorMsg(e, setError, form);
                }

            } catch (e) {
                setErrorMsg(e, setError, form);
            } finally {
                setLoadingText('Validating email...');
            }
        })
    };

    useEffect(() => {
        setIsFormSubmitting(isPending);
    }, [isPending]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="name@example.com" autoFocus {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <section className='flex flex-col gap-1'>
                    <LoadingButton
                        type='submit'
                        isLoading={isPending}
                        disabled={isPending}
                        loadingText={loadingText}
                    >
                        <KeyRound className="h-4 w-4" />
                        Sign in with Passkey
                    </LoadingButton>

                    {
                        error && (
                            <p className="text-sm text-destructive mt-1">{error}</p>
                        )
                    }
                </section>
            </form>
        </Form>
    )
}

function setErrorMsg(error: unknown, setError: React.Dispatch<React.SetStateAction<string | null>>, form: UseFormReturn<loginFormSchemaType>) {
    if (error instanceof AxiosError) {
        const err = error.response?.data?.message;

        if (err instanceof Object && 'message' in err) {
            if (!!err?.field) {
                form.setError(err.field, { message: err?.message });
                form.setFocus(err.field);
            } else {
                setError(err?.message);
            }
        } else if (typeof err === 'string') {
            setError(err);
        } else {
            setError(error.message);
        }
    } else {
        setError('Something went wrong');
    }
}