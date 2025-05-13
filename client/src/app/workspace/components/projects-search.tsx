"use client"

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import React, { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { languageFields } from './new-project-form'

type Props = {}

export default function ProjectsSearch({ }: Props) {
    const [searchQuery, setSearchQuery] = useState("")
    const [languageFilter, setLanguageFilter] = useState("all")
    const [sortBy, setSortBy] = useState("lastOpened")

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search projects..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-4">
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
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

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lastOpened">Last Opened</SelectItem>
                        <SelectItem value="createdAt">Creation Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}