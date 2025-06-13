"use client";

import { useCustomSearchParams } from "@/hooks/useCustomSearchParams"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { settignsTabs } from "../page"

export default function SettingTabs({ defaultActive }: { defaultActive: typeof settignsTabs[0]['id'] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState<typeof settignsTabs[0]['id']>(defaultActive)
    const [hoverStyle, setHoverStyle] = useState({})
    const [activeStyle, setActiveStyle] = useState({})
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])
    const { setSearchParams } = useCustomSearchParams();

    useEffect(() => {
        if (hoveredIndex !== null) {
            const hoveredElement = tabRefs.current[hoveredIndex]
            if (hoveredElement) {
                const { offsetLeft, offsetWidth } = hoveredElement
                setHoverStyle({
                    left: `${offsetLeft}px`,
                    width: `${offsetWidth}px`,
                })
            }
        }
    }, [hoveredIndex])

    useEffect(() => {
        const activeElement = tabRefs.current[activeIndex]
        if (activeElement) {
            const { offsetLeft, offsetWidth } = activeElement
            setActiveStyle({
                left: `${offsetLeft}px`,
                width: `${offsetWidth}px`,
            })
        }
    }, [activeIndex])

    useEffect(() => {
        requestAnimationFrame(() => {
            const overviewElement = tabRefs.current[activeIndex]
            if (overviewElement) {
                const { offsetLeft, offsetWidth } = overviewElement
                setActiveStyle({
                    left: `${offsetLeft}px`,
                    width: `${offsetWidth}px`,
                })
            }
        })
    }, []);

    function handleTabSelect(tab: typeof settignsTabs[0]) {
        setActiveIndex(tab.id);
        setSearchParams('tab', tab.name);
    }

    return (
        <section className="border-b pb-1.5 max-w-full overflow-hidden">
            <div className="relative">
                {/* Hover Highlight */}
                <div
                    className="absolute h-[30px] transition-all duration-300 ease-out bg-muted rounded-[6px] flex items-center"
                    style={{
                        ...hoverStyle,
                        opacity: hoveredIndex !== null ? 1 : 0,
                    }}
                />

                {/* Active Indicator */}
                <div
                    className="absolute bottom-[-6px] h-[2px] bg-primary transition-all duration-300 ease-out"
                    style={activeStyle}
                />

                {/* Tabs */}
                <nav className="relative flex space-x-[6px] items-center">
                    {settignsTabs.map((tab, index) => (
                        <div
                            key={index}
                            role="listitem"
                            // @ts-ignore
                            ref={(el) => (tabRefs.current[index] = el)}
                            className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] ${index === activeIndex ? "text-primary" : "text-muted-foreground"
                                }`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => handleTabSelect(tab)}
                        >
                            <div className={cn(
                                "text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full",
                                (hoveredIndex === index && activeIndex !== index) ? "text-foreground" : ""
                            )}>
                                {tab.label}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </section>
    )
}

