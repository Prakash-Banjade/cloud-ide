import LoadingButton from "@/components/loading-button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAppMutation } from "@/hooks/useAppMutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    projectName: z
        .string()
        .min(3, { message: "Project name must be at least 3 characters." })
        .max(20, { message: "Project name must be less than 20 characters." }),
});

type formSchemaType = z.infer<typeof formSchema>;

type Props = {
    defaultValues: formSchemaType
    projectId: string
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    toastOnSuccess?: boolean
}

export default function ProjectRenameForm({ defaultValues, projectId, setIsOpen, toastOnSuccess = true }: Props) {
    const router = useRouter();
    const queryclient = useQueryClient();

    const form = useForm<formSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const { mutateAsync, isPending } = useAppMutation<formSchemaType, { message: string, replId: string }>();

    async function onSubmit(values: formSchemaType) {
        await mutateAsync({
            endpoint: `/projects/${projectId}`,
            method: 'patch',
            data: values,
            toastOnSuccess,
        });

        queryclient.invalidateQueries({
            queryKey: ['project'],
        });

        router.refresh();

        if (setIsOpen) setIsOpen(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project name</FormLabel>
                            <FormControl>
                                <Input placeholder="My awesome project" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <LoadingButton
                    type="submit"
                    isLoading={isPending}
                    loadingText="Updating..."
                    size={"sm"}
                >
                    Update
                </LoadingButton>
            </form>
        </Form>
    )
}