"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { buttonVariants } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import LoadingButton from "@/components/loading-button"
import { NAME_REGEX, NAME_WITH_SPACE_REGEX } from "@/lib/CONSTANTS"
import { useAppMutation } from "@/hooks/useAppMutation"
import { useServerErrorInField } from "@/hooks/useServerErrorInField"
import toast from "react-hot-toast"

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^a-zA-Z0-9]/, "Password must include a special character");

const signupFormSchema = z
    .object({
        firstName: z.string().min(1, "First name is required").regex(NAME_REGEX, "First name must only contain letters"),
        lastName: z.string().min(1, "Last name is required").regex(NAME_WITH_SPACE_REGEX, "Last name must only contain letters and spaces"),
        email: z.string().email("Invalid email address"),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

export type signUpFormSchemaType = z.infer<typeof signupFormSchema>;

export function SignUpForm() {
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    const form = useForm<signUpFormSchemaType>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const { mutateAsync, error } = useAppMutation<signUpFormSchemaType, { message: string }>();

    async function onSubmit(values: signUpFormSchemaType) {
        setSuccessMsg(null);

        const res = await mutateAsync({
            endpoint: '/auth/register',
            method: 'post',
            data: values,
            toastOnSuccess: false,
        });

        if (res.status === 201) {
            toast.success("Account created");
            setSuccessMsg(res.data.message);
        }

        form.reset();
    };

    useServerErrorInField(error, form);

    return (
        <section className="space-y-8">
            {
                successMsg && <div className="p-4 rounded-md border text-green-900 border-green-300 bg-green-200">
                    <h3 className="font-medium">Success!</h3>
                    <p className="text-sm">{successMsg}</p>
                </div>
            }

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <section className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="John" autoFocus {...field} required />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="Doe" {...field} required />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </section>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="johndoe@example.com" {...field} required />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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

                    <section className="space-y-3">
                        <LoadingButton
                            type="submit"
                            className="w-full"
                            isLoading={form.formState.isSubmitting}
                            loadingText="Registering..."
                        >
                            Register
                        </LoadingButton>
                    </section>

                    <p className="text-sm text-muted-foreground mt-5 text-center">
                        Already have an account?&nbsp;

                        <Link
                            href="/auth/login"
                            className={buttonVariants({ variant: 'link', className: '!p-0 h-fit' })}
                        >
                            Sign in
                        </Link>
                    </p>

                </form>
            </Form>
        </section>
    )
}