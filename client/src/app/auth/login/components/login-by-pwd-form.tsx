"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { buttonVariants } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import LoadingButton from "@/components/loading-button"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import axiosClient from "@/lib/axios-client"
import { TLoginResponse } from "@/types"
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

    const form = useForm<loginFormSchemaType>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "prakash@gmail.com",
            password: "Prakash@122",
        },
    })

    function onSubmit(values: loginFormSchemaType) {
        startTransition(async () => {
            try {
                const res = await axiosClient.post<TLoginResponse>(`/auth/login`, values);

                if (!res.data) throw new Error("Invalid credentials");

                const data = res.data;

                if ('message' in data && 'hasPasskey' in data && data.message === AuthMessage.DEVICE_NOT_FOUND) {
                    sessionStorage.setItem("loginChallengeDto", JSON.stringify({ email: values.email, hasPasskey: !!data.hasPasskey })); // required in challenge page
                    router.replace("/auth/login/challenge");
                    return;
                }

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
            } catch (error) {
                if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error("An error occurred during sign in");
                }
            }
        })
    };

    React.useEffect(() => {
        setIsFormSubmitting(isPending);
    }, [isPending]);

    return (
        <div className={cn("grid gap-6", className)} {...props}>
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