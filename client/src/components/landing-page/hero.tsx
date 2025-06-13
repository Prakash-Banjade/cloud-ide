"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Skeleton } from "../ui/skeleton";

const Hero = () => {
    const { data, status } = useSession();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />

            {/* Animated background dots */}
            <div className="absolute inset-0 opacity-30">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-dodgerblue rounded-full"
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

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    {/* Main heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text lg:leading-[105px] md:leading-[80px] leading-[60px]"
                    >
                        C<Code className="inline text-dodgerblue sm:size-12 md:size-16 lg:size-20 stroke-[4px]" />de Anywhere,
                        <br />
                        Build Everything
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        The ultimate cloud IDE. Fully browser-based coding platform that&apos;s accessible anywhere and supports multiple programming languages.
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        {
                            status === "loading" ? (
                                <Skeleton className="mx-auto h-12 w-56 rounded-full" />
                            ) : !data ? (
                                <Button
                                    size="lg"
                                    className="bg-dodgerblue hover:bg-dodgerblue/90 text-white px-8 py-6 text-lg font-semibold rounded-full group transition-all duration-300 transform hover:scale-105"
                                    asChild
                                >
                                    <Link href="/auth/login">
                                        Get Started Free
                                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className="bg-dodgerblue hover:bg-dodgerblue/90 group text-white !px-12 !py-7 text-lg font-semibold rounded-full transition-all"
                                    asChild
                                >
                                    <Link href="/workspace">
                                        Workspace
                                        <ArrowRight className="size-5 group-hover:translate-x-2 transition-transform duration-300" />
                                    </Link>
                                </Button>
                            )
                        }
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
                    >
                        {[
                            { label: "Languages Supported", value: "15+" },
                            { label: "Projects Created", value: "10K+" },
                            { label: "Active Users", value: "5K+" },
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl font-bold text-dodgerblue mb-2">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
