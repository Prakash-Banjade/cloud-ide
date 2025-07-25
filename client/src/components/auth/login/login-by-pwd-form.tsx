"use client"

import * as React from "react"
import { cn, getErrMsg } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { buttonVariants } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import LoadingButton from "@/components/loading-button"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import axiosClient from "@/lib/axios-client"
import { TLoginResponse } from "@/types/types"
import { AuthMessage } from "@/lib/CONSTANTS"

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
    setIsFormSubmitting: React.Dispatch<React.SetStateAction<boolean>>
}

const loginFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string({ required_error: "Password is required" }).min(8, { message: "Password must be at least 8 characters long" }),
})

export type loginFormSchemaType = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, setIsFormSubmitting, ...props }: LoginFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();
    const [errMsg, setErrMsg] = React.useState<string | null>(null);
    const searchParams = useSearchParams();

    const form = useForm<loginFormSchemaType>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function onSubmit(values: loginFormSchemaType) {
        setErrMsg(null);

        startTransition(async () => {
            try {
                const res = await axiosClient.post<TLoginResponse | { message: string }>(`/auth/login`, values);

                if (!res.data) throw new Error("Invalid credentials");

                const data = res.data;

                if ('message' in data && 'hasPasskey' in data && data.message === AuthMessage.DEVICE_NOT_FOUND) {
                    sessionStorage.setItem("loginChallengeDto", JSON.stringify({ email: values.email, hasPasskey: !!data.hasPasskey })); // required in challenge page
                    router.replace("/auth/login/challenge");
                    return;
                }

                if ('message' in data && data.message === AuthMessage.OTP_SENT_MESSAGE) {
                    setErrMsg("This account is not been verified yet. Please check your email for the verification OTP and use the OTP to verify your account.");
                    form.reset();
                    return;
                }

                await signIn("credentials", {
                    ...data,
                    callbackUrl: searchParams.get("callbackUrl") || "/workspace",
                });

                localStorage.setItem("hasLoggedInBefore", "true");
            } catch (error) {
                const errMsg = getErrMsg(error);
                setErrMsg(errMsg ?? "Failed to login");
            }
        })
    };

    React.useEffect(() => {
        setIsFormSubmitting(isPending);
    }, [isPending]);

    return (
        <div className={cn("space-y-6", className)} {...props}>
            {
                errMsg && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                        {errMsg}
                    </p>
                )
            }

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

                    <section>
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="********" {...field} required />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <p className="text-sm text-muted-foreground mt-2 text-right">
                            <Link
                                href="/auth/forgot-password"
                                className={buttonVariants({ variant: 'link', className: '!p-0 h-fit' })}
                            // state={{
                            //     email: EMAIL_REGEX.test(form.getValues('email')) ? form.getValues('email') : ''
                            // }}
                            >
                                Forgot password?
                            </Link>
                        </p>
                    </section>

                    <section className="space-y-3">
                        <LoadingButton
                            type="submit"
                            className="w-full"
                            isLoading={isPending}
                            loadingText="Signing in..."
                        >
                            Sign In
                        </LoadingButton>
                    </section>

                </form>
            </Form>
        </div>
    )
}