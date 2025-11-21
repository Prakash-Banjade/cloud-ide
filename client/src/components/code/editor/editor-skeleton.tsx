import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
    return (
        <div className="flex h-full min-h-[400px] w-full flex-col bg-sidebar">
            <div className="flex flex-1 overflow-hidden">
                {/* Gutter / line-number column */}
                <div className="flex w-12 flex-col items-center gap-2 px-1 py-3">
                    {Array.from({ length: 28 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-4 w-6 rounded-xs"
                        />
                    ))}
                </div>

                {/* Code area */}
                <div className="flex-1 px-4 py-3">
                    <div className="flex flex-col gap-8">
                        {/* Block 1 */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[13%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[2%] rounded-xs" />
                                <Skeleton className="h-4 w-[15%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                            </div>
                        </div>

                        {/* Block 2 */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[15%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                                <Skeleton className="h-4 w-[1%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                                <Skeleton className="h-4 w-[3%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                            </div>
                            <Skeleton className="h-4 w-[1%] rounded-xs" />
                        </div>

                        {/* Block 3 */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                                <Skeleton className="h-4 w-[1%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                                <Skeleton className="h-4 w-[3%] rounded-xs" />
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[1%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-16">
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                                <Skeleton className="h-4 w-[3%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-16">
                                <Skeleton className="h-4 w-[12%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-16">
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                            </div>
                            <Skeleton className="h-4 w-[1%] rounded-xs ml-8" />
                            <Skeleton className="h-4 w-[1%] rounded-xs" />
                        </div>

                        {/* Block 4 */}
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[1%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[11%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[6%] rounded-xs" />
                                <Skeleton className="h-4 w-[5%] rounded-xs" />
                                <Skeleton className="h-4 w-[9%] rounded-xs" />
                                <Skeleton className="h-4 w-[10%] rounded-xs" />
                            </div>
                            <div className="flex gap-2 ml-8">
                                <Skeleton className="h-4 w-[8%] rounded-xs" />
                                <Skeleton className="h-4 w-[3%] rounded-xs" />
                                <Skeleton className="h-4 w-[4%] rounded-xs" />
                                <Skeleton className="h-4 w-[7%] rounded-xs" />
                            </div>
                            <Skeleton className="h-4 w-[1%] rounded-xs" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
