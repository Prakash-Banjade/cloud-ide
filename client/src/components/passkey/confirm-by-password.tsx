import { useAppMutation } from "@/hooks/useAppMutation";
import { QueryKey } from "@/lib/query-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "../ui/input";
import LoadingButton from "../loading-button";

type Props = {
    setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

const formSchema = z.object({
    sudo_password: z.string().min(1, {
        message: "Password is required",
    })
});

type TFormSchema = z.infer<typeof formSchema>;

export function ConfirmByPassword({ setIsVerified }: Props) {
    const form = useForm<TFormSchema>({
        defaultValues: { sudo_password: "" },
        resolver: zodResolver(formSchema),
    });

    const { mutateAsync, isPending } = useAppMutation<TFormSchema, { verified: boolean }>();

    async function onSubmit(values: TFormSchema) {
        const res = await mutateAsync({
            endpoint: QueryKey.AUTH_VERIFY_SUDO,
            method: 'post',
            data: values,
            toastOnError: false,
            toastOnSuccess: false,
        });

        if (res.data?.verified === true) {
            setIsVerified(true);
        } else {
            form.setError('sudo_password', { message: "Invalid password", type: 'manual' });
            form.setFocus('sudo_password');
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="sudo_password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="********"
                                    {...field}
                                    required
                                    autoFocus
                                    autoComplete="current-password webauthn"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <section className="mt-4">
                    <LoadingButton
                        type="submit"
                        className="w-full"
                        isLoading={isPending}
                        loadingText="Verifying..."
                    >
                        Confirm
                    </LoadingButton>
                </section>
            </form>
        </Form>
    )
}
