import { useAppMutation } from "@/hooks/useAppMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingButton from "@/components/loading-button";

const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    logout: z.boolean(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type TChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {

    const form = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            logout: false
        },
        mode: 'onChange'
    });

    const { mutateAsync, error, isPending } = useAppMutation();

    async function onSubmit(values: TChangePasswordSchema) {
        await mutateAsync({
            endpoint: "auth/change-password",
            method: 'post',
            data: values,
            toastOnError: false,
        })

        form.reset();

        if (values.logout) { signOut() }
    };

    useEffect(() => { // show error directly in form field if send by server
        const errObj = (error as any)?.response?.data?.message;
        if (!!errObj?.field) {
            form.setError(errObj.field, { message: errObj?.message });
            form.setFocus(errObj.field);
        }
    }, [error])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="currentPassword"
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
                    name="newPassword"
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
                    name={"logout"}
                    render={({ field }) => (
                        <FormItem className={"flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-fit"}>
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    required
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Logout of all devices
                                </FormLabel>
                                <FormDescription>
                                    If checked, the user will be logged out of all logged in devices.
                                </FormDescription>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <LoadingButton
                    type="submit"
                    isLoading={isPending}
                    loadingText="Signing in..."
                >
                    Change Password
                </LoadingButton>
            </form>
        </Form>

    )
}