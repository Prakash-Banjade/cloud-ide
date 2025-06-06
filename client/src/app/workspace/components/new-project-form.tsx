"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ELanguage } from "@/types"
import LoadingButton from "@/components/loading-button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppMutation } from "@/hooks/useAppMutation"
import { languageFields } from "@/lib/utils"

const formSchema = z.object({
    projectName: z
        .string()
        .min(3, { message: "Project name must be at least 3 characters." })
        .max(20, { message: "Project name must be less than 20 characters." }),
    language: z.nativeEnum(ELanguage, { errorMap: () => ({ message: "Please select a programming language." }) }),
})

type formSchemaType = z.infer<typeof formSchema>;

export function NewProjectForm() {
    const router = useRouter();

    const form = useForm<formSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectName: "",
        },
    });

    const { mutateAsync, isPending } = useAppMutation<formSchemaType, { message: string, replId: string }>();

    async function onSubmit(values: formSchemaType) {
        const res = await mutateAsync({
            endpoint: `/projects`,
            method: 'post',
            data: values
        });

        if (res.status === 201) {
            const replId = res.data.replId;

            router.push(`/code/${replId}`);
        }
    }

    return (
        <section>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My awesome project" {...field} />
                                </FormControl>
                                <FormDescription>This will be the unique identifier for your project.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Programming Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a language" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {
                                            languageFields.map((field, ind) => {
                                                return (
                                                    <SelectItem key={ind} value={field.value}>
                                                        <field.icon />
                                                        {field.label}
                                                    </SelectItem>
                                                )
                                            })
                                        }
                                    </SelectContent>
                                </Select>
                                <FormDescription>Select the primary language for your project.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <LoadingButton
                        type="submit"
                        isLoading={isPending}
                        className="w-full"
                        loadingText="Creating Project..."
                    >
                        <Plus />Create Project
                    </LoadingButton>
                </form>
            </Form>
        </section>
    )
}
