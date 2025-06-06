"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const CheckIcon = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={cn("w-6 h-6", className)}
        >
            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    )
}

const CheckFilled = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn("w-6 h-6", className)}
        >
            <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
            />
        </svg>
    )
}

type LoadingState = {
    text: string
}

const LoaderCore = ({
    loadingStates,
    value = 0,
}: {
    loadingStates: LoadingState[]
    value?: number
}) => {
    return (
        <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
            {loadingStates.map((loadingState, index) => {
                const distance = Math.abs(index - value)
                const opacity = Math.max(1 - distance * 0.2, 0) // Minimum opacity is 0, keep it 0.2 if you're sane.

                return (
                    <div
                        key={index}
                        className={cn("text-left flex gap-2 mb-4 transition-all duration-500 ease-in-out", "css-animate-item")}
                        style={{
                            opacity: opacity,
                            transform: `translateY(${-(value * 40)}px)`,
                        }}
                    >
                        <div>
                            {index > value && <CheckIcon className="text-black dark:text-white" />}
                            {index <= value && (
                                <CheckFilled
                                    className={cn(
                                        "text-black dark:text-white",
                                        value === index && "text-black dark:text-lime-500 opacity-100",
                                    )}
                                />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-black dark:text-white",
                                value === index && "text-black dark:text-lime-500 opacity-100",
                            )}
                        >
                            {loadingState.text}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export const MultiStepLoader = ({
    loadingStates,
    loading,
    duration = 2000,
    loop = false,
    currentStateValue,
    autoProgress = false,
    onStateChange,
}: {
    loadingStates: LoadingState[]
    loading?: boolean
    duration?: number
    loop?: boolean
    currentStateValue?: number
    autoProgress?: boolean
    onStateChange?: (state: number) => void
}) => {
    const [internalState, setInternalState] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    // Use external value if provided, otherwise use internal state
    const currentState = currentStateValue !== undefined ? currentStateValue : internalState

    useEffect(() => {
        if (!loading) {
            setIsVisible(false)
            const timeout = setTimeout(() => {
                setInternalState(0)
            }, 300) // Wait for fade-out animation to complete
            return () => clearTimeout(timeout)
        } else if (loading && !isVisible) {
            setIsVisible(true)
        }
    }, [loading])

    useEffect(() => {
        if (!loading || !autoProgress) return

        const timeout = setTimeout(() => {
            const nextState = loop
                ? currentState === loadingStates.length - 1
                    ? 0
                    : currentState + 1
                : Math.min(currentState + 1, loadingStates.length - 1)

            setInternalState(nextState)

            if (onStateChange) {
                onStateChange(nextState)
            }
        }, duration)

        return () => clearTimeout(timeout)
    }, [currentState, loading, loop, loadingStates.length, duration, autoProgress, onStateChange])

    return (
        <>
            {loading && (
                <div
                    className={cn(
                        "w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl transition-opacity duration-300",
                        isVisible ? "opacity-100" : "opacity-0",
                    )}
                >
                    <div className="h-96 relative">
                        <LoaderCore value={currentState} loadingStates={loadingStates} />
                    </div>

                    <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
                </div>
            )}
        </>
    )
}
