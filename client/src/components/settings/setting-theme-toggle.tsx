"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"

const appearanceFormSchema = z.object({
    theme: z.enum(["light", "dark", "system"], {
        required_error: "Please select a theme.",
    })
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function SettingThemeToggle() {
    const { theme } = useTheme();

    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const form = useForm<AppearanceFormValues>({
        resolver: zodResolver(appearanceFormSchema),
        defaultValues: {
            theme: theme === "dark" ? "dark" : theme === "system" ? "system" : "light",
        },
    });

    return (
        <Form {...form}>
            <form className="space-y-8">
                <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                        <FormItem className="space-y-1">
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap max-w-2xl gap-8"
                            >
                                <FormItem>
                                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary flex flex-col">
                                        <FormControl>
                                            <RadioGroupItem value="system" className="sr-only" />
                                        </FormControl>
                                        {
                                            isSystemDark ? <DarkThemeBtn theme="system" /> : <LightThemeBtn theme="system" />
                                        }
                                        <span className="block w-full p-2 text-center font-normal">
                                            System
                                        </span>
                                    </FormLabel>
                                </FormItem>
                                <FormItem>
                                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary flex flex-col">
                                        <FormControl>
                                            <RadioGroupItem value="light" className="sr-only" />
                                        </FormControl>
                                        <LightThemeBtn />
                                        <span className="block w-full p-2 text-center font-normal">
                                            Light
                                        </span>
                                    </FormLabel>
                                </FormItem>
                                <FormItem>
                                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary flex flex-col">
                                        <FormControl>
                                            <RadioGroupItem value="dark" className="sr-only" />
                                        </FormControl>
                                        <DarkThemeBtn />
                                        <span className="block w-full p-2 text-center font-normal">
                                            Dark
                                        </span>
                                    </FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

function LightThemeBtn({ theme = "light" }: { theme?: string }) {
    const { setTheme } = useTheme();

    return (
        <div role="button" className="items-center rounded-md border-2 border-muted p-1 hover:border-accent" onClick={() => setTheme(theme)}>
            <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
            </div>
        </div>
    )
}

function DarkThemeBtn({ theme = "dark" }: { theme?: string }) {
    const { setTheme } = useTheme();

    return (
        <div role="button" className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground" onClick={() => setTheme(theme)}>
            <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
            </div>
        </div>
    )
}