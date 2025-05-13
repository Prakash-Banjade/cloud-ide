"use client"

import { Input } from '@/components/ui/input'
import { LayoutGrid, List, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { languageFields } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCustomSearchParams } from '@/hooks/useCustomSearchParams'
import { z } from 'zod'
import { ELanguage } from '@/types'
import SearchInput from '@/components/search-input'

const searchSchema = z.object({
    q: z.string().optional(),
    language: z.union([z.nativeEnum(ELanguage), z.literal("all")]).optional(),
    sortBy: z.string().optional(),
    view: z.enum(["grid", "list"]).optional()
});

const defaultValues: z.infer<typeof searchSchema> = {
    q: "",
    language: "all",
    sortBy: "lastUpdated",
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
        console.log(data)


        if (success) {
            setSearchState(data);
        }
    }, []);

    function handleChange(name: string, value: string) {
        setSearchParams(name, value);
        setSearchState(prev => ({
            ...prev, [name]: value
        }));
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <SearchInput
                    placeholder="Search projects..."
                    className="pl-8"
                />
            </div>
            <div className="flex gap-4">
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
                        <SelectItem value="lastUpdated">Last Updated</SelectItem>
                        <SelectItem value="createdAt">Creation Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                </Select>

                <section>
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
        </div>
    )
}