"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppMutation } from "@/hooks/useAppMutation";
import { QueryKey } from "@/lib/query-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LoadingButton from "../loading-button";
import Link from "next/link";

const formSchema = z.object({
    email: z.string().email(),
});

export default function ForgotPasswordForm() {
    const [responseMsg, setResponseMsg] = useState<string | null>(null);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        }
    })

    const { mutateAsync, error } = useAppMutation<{ email: string }, { message: string }>();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            try {
                const response = await mutateAsync({
                    method: "post",
                    endpoint: QueryKey.AUTH_FORGOT_PASSWORD,
                    data: values,
                    toastOnSuccess: false,
                });

                if (response?.data?.message) {
                    setResponseMsg(response?.data?.message);
                }
            } catch (e) {
                console.log(e);
            }
        })
    };

    // show error directly in form field if send by server
    useEffect(() => { // show error directly in form field if send by server
        const errObj = (error as any)?.response?.data?.message;
        if (!!errObj?.field) {
            form.setError(errObj.field, { message: errObj?.message });
            form.setFocus(errObj.field);
        }
    }, [error]);

    return (
        <>
            {
                responseMsg ? (
                    <div className="space-y-6 mt-6">
                        <p className="text-green-500 bg-green-400/10 py-2 rounded-md font-medium flex items-center justify-center gap-2">
                            <Check size={18} /> Mail Sent - Check Your Email
                        </p>
                        <p className="text-muted-foreground">
                            We&apos;ve sent a password reset link to your email address.
                            Please check your inbox and follow the instructions to reset your password.
                        </p>
                        <p>
                            {responseMsg}
                        </p>
                        <Button onClick={() => router.push('/auth/login')} className="w-full">
                            Return to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="text-left">
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Enter your email address" required {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <LoadingButton
                                    isLoading={isPending}
                                    loadingText="Sending..."
                                    type="submit"
                                    className="w-full"
                                >
                                    Send Reset Link
                                </LoadingButton>
                            </form>
                        </Form>

                        <p className="mt-6 text-center text-muted-foreground text-sm">
                            Remember your password?{' '}
                            <Link href="/auth/login" className="text-primary hover:underline" replace>
                                Log in
                            </Link>
                        </p>
                    </>
                )
            }
        </>
    );
}