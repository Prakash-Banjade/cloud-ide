"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { QueryKey } from "@/lib/query-keys";
import axiosClient from "@/lib/axios-client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "../ui/input";
import LoadingButton from "../loading-button";

type Props = {
    token: string;
}

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type TResetPasswordSchema = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordForm({ token }: Props) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const { mutateAsync } = useMutation({
        mutationFn: (data: { password: string, token: string }) => axiosClient.post(`/${QueryKey.AUTH_RESET_PASSWORD}`, data),
        onError: (error) => {
            if (error instanceof AxiosError) {
                if (error.response?.data?.message instanceof Object && 'message' in error.response.data.message) {
                    if (error.response.data.message.message?.includes('expired')) {
                        setError(error.response?.data.message?.message);
                    } else {
                        form.setError('password', { message: error.response.data.message.message });
                    }
                } else if (typeof error.response?.data?.message === 'string') {
                    form.setError('password', { message: error.response?.data?.message });
                } else {
                    form.setError('password', { message: error.message });
                }
            }
        },
        onSuccess(data) {
            if (data?.data?.message) {
                toast.success(data.data.message);
                router.push('/auth/login');
            }
        },
    })

    const form = useForm<TResetPasswordSchema>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (values: TResetPasswordSchema) => {
        setError(null);
        startTransition(async () => {
            try {
                await mutateAsync({ password: values.password, token });
            } catch (e) {
                console.error(e);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="********" autoFocus {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="********" {...field} required />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <LoadingButton isLoading={isPending} loadingText="Resetting..." type="submit" className="w-full">
                    Reset Password
                </LoadingButton>

                <p className="text-destructive text-sm text-center min-h-4">{error || ''}</p>
            </form>
        </Form>
    )
}