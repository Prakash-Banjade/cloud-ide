"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ELanguage } from "@/types/types"
import LoadingButton from "@/components/loading-button"
import { File, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppMutation } from "@/hooks/useAppMutation"
import { useTransition } from "react"
import { Icons } from "../icons"

const formSchema = z.object({
    projectName: z
        .string()
        .min(3, { message: "Project name must be at least 3 characters." })
        .max(20, { message: "Project name must be less than 20 characters." }),
    language: z.nativeEnum(ELanguage, { errorMap: () => ({ message: "Please select a programming language." }) }),
});

const languageFields = {
    empty: [
        {
            value: ELanguage.NONE,
            label: "Empty",
            icon: File
        },
    ],
    javaScript: [
        {
            value: ELanguage.REACT_JS,
            label: "React + JS",
            icon: Icons.javascript
        },
        {
            value: ELanguage.REACT_TS,
            label: "React + TS",
            icon: Icons.tsx
        },
        {
            value: ELanguage.NEXT_TS,
            label: "Next + TS",
            icon: Icons.nextjs
        },
        {
            value: ELanguage.NODE_JS,
            label: "Node JS",
            icon: Icons.node
        },
    ],
    python: [
        {
            value: ELanguage.PYTHON,
            label: "Python",
            icon: Icons.python
        },
    ],
    c: [
        {
            value: ELanguage.C,
            label: "C",
            icon: Icons.c
        },
        {
            value: ELanguage.CPP,
            label: "C++",
            icon: Icons.cpp
        },
    ],
    java: [
        {
            value: ELanguage.JAVA,
            label: "Java",
            icon: Icons.java
        },
    ]
}

type formSchemaType = z.infer<typeof formSchema>;

export function NewProjectForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<formSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectName: "",
        },
    });

    const { mutateAsync } = useAppMutation<formSchemaType, { message: string, replId: string }>();

    async function onSubmit(values: formSchemaType) {
        startTransition(async () => {
            const res = await mutateAsync({
                endpoint: `/projects`,
                method: 'post',
                data: values
            });

            if (res.status === 201) {
                const replId = res.data.replId;

                router.push(`/code/${replId}`);
            }
        })
    }

    return (
        <section>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                    <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My awesome project" autoComplete="off" {...field} />
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
                                            Object.entries(languageFields).map(([key, value]) => (
                                                <SelectGroup key={key}>
                                                    <SelectLabel className="capitalize">{key}</SelectLabel>
                                                    {
                                                        value.map((lang) => (
                                                            <SelectItem key={lang.value} value={lang.value}>
                                                                <lang.icon className="mr-2 h-4 w-4" />
                                                                {lang.label}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectGroup>
                                            ))
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
