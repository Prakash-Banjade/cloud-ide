"use client"

import { LayoutGrid, List, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { languageFields } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { z } from 'zod'
import { ELanguage } from '@/types/types'
import SearchInput from '@/components/search-input'

export function ProjectsListTabs(props: {
    projectList: React.ReactNode,
}) {
    const { searchParams, setSearchParams } = useCustomSearchParams();
    const [activeTab, setActiveTab] = useState<"own" | "shared">(searchParams.get("tab") as "own" | "shared" || "own");

    useEffect(() => {
        setSearchParams("tab", activeTab);
    }, [activeTab]);

    return (
        <section className='space-y-6'>
            <div className='bg-secondary p-1 rounded-lg w-fit'>
                <Button
                    variant={activeTab === "own" ? "default" : "ghost"}
                    size={"sm"}
                    type="button"
                    onClick={() => setActiveTab("own")}
                >
                    My projects
                </Button>
                <Button
                    variant={activeTab === "shared" ? "default" : "ghost"}
                    size={"sm"}
                    type="button"
                    onClick={() => setActiveTab("shared")}
                >
                    Shared with me
                </Button>
            </div>

            {props.projectList}
        </section>
    )
}

const searchSchema = z.object({
    q: z.string().optional(),
    language: z.union([z.nativeEnum(ELanguage), z.literal("all")]).optional(),
    sortBy: z.string().optional(),
    view: z.enum(["grid", "list"]).optional()
});

const defaultValues: z.infer<typeof searchSchema> = {
    q: "",
    language: "all",
    sortBy: "lastOpened",
    view: "grid"
}

export default function ProjectsSearch() {
    const [searchState, setSearchState] = useState<z.infer<typeof searchSchema>>(defaultValues);
    const { searchParams, setSearchParams } = useCustomSearchParams();

    useEffect(() => {
        const { success, data } = searchSchema.safeParse({
            q: searchParams.get("q") ?? defaultValues.q,
            language: searchParams.get("language") ?? defaultValues.language,
            sortBy: searchParams.get("sortBy") ?? defaultValues.sortBy,
            view: searchParams.get("view") ?? defaultValues.view
        });

        if (success) {
            setSearchState(data);
        }
    }, []);

    function handleChange(name: string, value: string) {
        if (name === 'language' && value === 'all') {
            setSearchParams("language", undefined);
        } else {
            setSearchParams(name, value);
        }

        setSearchState(prev => ({
            ...prev, [name]: value
        }));
    }

    return (
        <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <SearchInput
                    placeholder="Search projects..."
                    className="pl-8"
                />
            </div>
            <Select value={searchState.language} onValueChange={val => handleChange("language", val)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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

            <Select value={searchState.sortBy} onValueChange={val => handleChange("sortBy", val)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="lastOpened">Last Opened</SelectItem>
                    <SelectItem value="createdAt">Creation Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                </SelectContent>
            </Select>

            <section className='flex'>
                <Button
                    variant={searchState.view === "grid" ? "secondary" : "ghost"}
                    onClick={() => handleChange("view", "grid")}
                    type="button"
                    size={"icon"}
                >
                    <LayoutGrid />
                </Button>
                <Button
                    variant={searchState.view === "list" ? "secondary" : "ghost"}
                    onClick={() => handleChange("view", "list")}
                    type="button"
                    size={"icon"}
                >
                    <List />
                </Button>
            </section>
        </div>
    )
}