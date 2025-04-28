"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ELanguage } from "@/types"
import { Icons } from "@/components/icons"
import { API_URL } from "@/lib/utils"
import LoadingButton from "@/components/loading-button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppMutation } from "@/hooks/useAppMutation"

const formSchema = z.object({
    replId: z
        .string()
        .min(3, { message: "Project name must be at least 3 characters." })
        .max(50, { message: "Project name must be less than 50 characters." })
        .refine((value) => /^[a-zA-Z0-9-_]+$/.test(value), {
            message: "Project name can only contain letters, numbers, hyphens, and underscores.",
        }),
    language: z.nativeEnum(ELanguage, { errorMap: () => ({ message: "Please select a programming language." }) }),
})

export function NewProjectForm() {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            replId: "",
        },
    });

    const { mutateAsync, isPending } = useAppMutation();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        
        const res = await mutateAsync({
            endpoint: `${API_URL}/projects`,
            method: 'post',
            data: values
        });

        if (res.status === 201) {
            router.push(`/code/${values.replId}`);
        }
    }

    return (
        <section>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="replId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="my-awesome-project" {...field} />
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
                                        <SelectItem value={ELanguage.REACT_JS}>
                                            <Icons.javascript />
                                            React + JS
                                        </SelectItem>
                                        <SelectItem value={ELanguage.REACT_TS}>
                                            <Icons.tsx />
                                            React + TS
                                        </SelectItem>
                                        <SelectItem value={ELanguage.NODE_JS}>
                                            <Icons.node />
                                            Node JS
                                        </SelectItem>
                                        <SelectItem value={ELanguage.PYTHON}>
                                            <Icons.python />
                                            Python
                                        </SelectItem>
                                        <SelectItem value={ELanguage.C}>
                                            <Icons.c />
                                            C Language
                                        </SelectItem>
                                        <SelectItem value={ELanguage.CPP}>
                                            <Icons.cpp />
                                            C++
                                        </SelectItem>
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
