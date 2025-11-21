"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Code } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function Hero() {
    const router = useRouter();
    const { theme } = useTheme();

    return (
        <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
            {/* Animated background dots */}
            <div className="absolute inset-0 opacity-30">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-brand rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
                    linear-gradient(to right, ${theme === "light" ? "#d1d5db" : "#232323"} 1px, transparent 1px),
                    linear-gradient(to bottom, ${theme === "light" ? "#d1d5db" : "#232323"} 1px, transparent 1px)
                    `,
                    backgroundSize: "32px 32px",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
                    maskImage:
                        "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
                }}
            />

            <div className="container mx-auto px-4 relative z-10">
                <div
                    // initial={{ opacity: 0, y: -20 }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.5 }}
                    className="overflow-hidden bg-background text-brand sm:text-sm text-xs text-center font-medium w-fit rounded-full mx-auto shadow-lg mb-8"
                >
                    <button
                        className="group rounded-full px-1 pl-3 py-1 bg-brand/10 flex items-center gap-2"
                        onClick={() => router.push("/auth/login")}
                    >
                        <div className="size-2 rounded-full bg-green-600 animate-caret-blink" />
                        Now support with AI-powered coding agent!
                        <span className="size-8 grid place-items-center bg-brand/20 rounded-full group-hover:rotate-45 transition-transform duration-300 origin-center">
                            <ArrowUpRight size={18} />
                        </span>
                    </button>
                </div>

                <div
                    // initial={{ opacity: 0, y: 20 }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.5 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    {/* Main heading */}
                    <h2
                        // initial={{ opacity: 0, y: 20 }}
                        // animate={{ opacity: 1, y: 0 }}
                        // transition={{ duration: 0.5, delay: 0.4 }}
                        className={cn(
                            "text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-shadow-md mb-6 font-medium lg:leading-[110px] md:leading-[90px] leading-[50px]",
                            "gradient-text bg-linear-120 from-foreground from-50% to-foreground/60 to-100%"
                        )}
                    >
                        C<Code className="inline text-brand sm:size-12 md:size-16 lg:size-20 stroke-[4px]" />de Anywhere,
                        <br />
                        Build Everything
                    </h2>

                    {/* Subtitle */}
                    <p
                        // initial={{ opacity: 0, y: 20 }}
                        // animate={{ opacity: 1, y: 0 }}
                        // transition={{ duration: 0.5, delay: 0.6 }}
                        className="sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-normal"
                    >
                        The ultimate cloud IDE. Fully browser-based coding platform that&apos;s accessible anywhere and supports multiple programming languages.
                    </p>

                    {/* CTA Button */}
                    <div
                    // initial={{ opacity: 0, y: 20 }}
                    // animate={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <Button
                            size="lg"
                            className="bg-brand hover:bg-brand/90 group text-white sm:!px-12 sm:!py-7 !px-8 !py-5 sm:text-lg sm:font-semibold font-medium rounded-full transition-all"
                            onClick={() => router.push("/auth/login")}
                        >
                            Get Started
                            <ArrowRight className="size-5 group-hover:translate-x-2 transition-transform duration-300" />
                        </Button>
                    </div>

                    {/* Stats */}
                    <div
                        // initial={{ opacity: 0, y: 20 }}
                        // animate={{ opacity: 1, y: 0 }}
                        // transition={{ duration: 0.5, delay: 1 }}
                        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
                    >
                        {[
                            { label: "Languages Supported", value: "8+" },
                            { label: "Projects Created", value: "10K+" },
                            { label: "Active Users", value: "5K+" },
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl font-bold text-brand mb-2">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
