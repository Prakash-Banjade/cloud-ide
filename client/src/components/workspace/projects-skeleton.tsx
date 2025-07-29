"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CardsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-52" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card className="overflow-hidden" key={i}>
                            <CardContent>
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-6 w-3/4 mb-4" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center">
                                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                                        <Skeleton className="h-4 w-16 mr-2" />
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                    </div>

                                    <div className="flex items-center">
                                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                                        <Skeleton className="h-4 w-16 mr-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>

                                    <div className="flex items-center">
                                        <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                                        <Skeleton className="h-4 w-16 mr-2" />
                                        <Skeleton className="h-4 w-28" />
                                    </div>

                                    <div className="flex items-center">
                                        <Skeleton className="h-5 w-32 rounded-sm" />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between">
                                <Skeleton className="size-12 rounded-full" />
                                <Skeleton className="h-9 w-24" />
                            </CardFooter>
                        </Card>
                    ))
                }
            </div>
        </div>
    )
}

export function ListsSkeleton() {
    return (
        <div className="space-y-6">
            {
                Array.from({ length: 6 }).map((_, i) => (
                    <div
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-900"
                        key={i}
                    >
                        <div className="flex-1 min-w-0 mb-4 sm:mb-0 sm:mr-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-5 w-24 ml-2 rounded-full" />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-5 w-32 rounded-sm" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Skeleton className="h-9 w-24 flex-1 sm:flex-none" />
                            <Skeleton className="h-9 w-24 flex-1 sm:flex-none" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </div>
                ))
            }
        </div>
    )
}
