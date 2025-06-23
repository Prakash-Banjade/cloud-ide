"use client";

import { motion } from "framer-motion";
import {
    Zap,
    Code,
    Eye,
    HardDrive,
    Cpu,
    RotateCcw,
    Shield
} from "lucide-react";

const Features = () => {
    const features = [
        {
            icon: Zap,
            title: "One Click Start",
            description: "Create projects in multiple languages instantly. No setup required.",
            gridClass: "md:col-span-1 md:row-span-1",
        },
        {
            icon: Code,
            title: "Browser Editor + Terminal",
            description: "Rich editor with syntax highlighting and integrated terminal. Everything you need in one place.",
            gridClass: "md:col-span-2 md:row-span-1",
        },
        {
            icon: Eye,
            title: "Live Application Preview",
            description: "See your changes in real-time with instant preview updates.",
            gridClass: "md:col-span-2 md:row-span-1",
        },
        {
            icon: HardDrive,
            title: "Persistent Storage",
            description: "Your code is automatically saved and synchronized across sessions.",
            gridClass: "md:col-span-1 md:row-span-1",
        },
        {
            icon: Cpu,
            title: "Automatic Resource Management",
            description: "Smart resource allocation that scales with your project needs.",
            gridClass: "md:col-span-1 md:row-span-1",
        },
        {
            icon: RotateCcw,
            title: "Seamless Session Restoration",
            description: "Pick up exactly where you left off with automatic session recovery.",
            gridClass: "md:col-span-1 md:row-span-1",
        },
        {
            icon: Shield,
            title: "Secure Authentication",
            description: "Enterprise-grade security to keep your code safe and private.",
            gridClass: "md:col-span-1 md:row-span-1",
        },
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Everything You Need to
                        <span className="text-brand"> Code</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powerful features that make coding in the cloud as seamless as local development
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`group relative p-6 rounded-2xl bg-card border border-border hover:border-brand/50 transition-all duration-300 ${feature.gridClass}`}
                            whileHover={{
                                scale: 1.02,
                                transition: { duration: 0.2 }
                            }}
                        >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center mb-4">
                                    <div className="p-2 rounded-lg bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors duration-300">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold mb-3 group-hover:text-brand transition-colors duration-300">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Animated border */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-brand/20 transition-all duration-300" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
