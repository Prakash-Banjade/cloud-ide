"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAppMutation } from "@/hooks/useAppMutation"
import toast from "react-hot-toast"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { TCurrentUser } from "@/types"
import RememberMe from "./remember-me"
import LoadingButton from "@/components/loading-button"

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
    setIsFormSubmitting: React.Dispatch<React.SetStateAction<boolean>>
}

const loginFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string({ required_error: "Password is required" }).min(8, { message: "Password must be at least 8 characters long" }),
})

export type loginFormSchemaType = z.infer<typeof loginFormSchema>;

export function LoginForm({ className, setIsFormSubmitting, ...props }: LoginFormProps) {

    const form = useForm<loginFormSchemaType>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const { mutateAsync } = useAppMutation<loginFormSchemaType, { access_token: string, user: TCurrentUser } | { message: string }>();

    async function onSubmit(values: loginFormSchemaType) {
        const response = await mutateAsync({
            method: "post",
            endpoint: "auth/login",
            data: values,
            toastOnSuccess: false,
        });

        if (!response.data) return;

        // if ('access_token' in response.data) {
        //     setAuth({
        //         accessToken: response.data.access_token,
        //         user: response.data.user,
        //     });
        //     const payload: TAuthPayload = jwtDecode(response.data.access_token);

        //     navigate(location.state?.from?.pathname || `/${payload.role}/dashboard`, { replace: true });
        // }

        // if ('message' in response.data && 'hasPasskey' in response.data && response.data.message === AuthMessage.DEVICE_NOT_FOUND) {
        //     return navigate("challenge", { replace: true, state: { email: form.getValues('email'), hasPasskey: !!response.data.hasPasskey } });
        // }

        // if ('message' in response.data) {
        //     toast(response.data.message);
        //     form.reset();
        // }
    };

    React.useEffect(() => {
        setIsFormSubmitting(form.formState.isSubmitting);
    }, [form.formState.isSubmitting]);

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
                                    <Input type="email" placeholder="name@example.com" autoFocus {...field} />
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
                                        <Input type="password" placeholder="********" {...field} />
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
                        <RememberMe />
                        <LoadingButton
                            type="submit"
                            className="w-full"
                            isLoading={form.formState.isSubmitting}
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