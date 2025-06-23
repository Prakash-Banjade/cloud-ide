"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const Pricing = () => {
    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for getting started with cloud development",
            features: [
                { text: "3 Projects", included: true },
                { text: "Basic Editor & Terminal", included: true },
                { text: "Live Preview", included: true },
                { text: "Limited Resources", included: true },
                { text: "Community Support", included: true },
                { text: "Unlimited Projects", included: false },
                { text: "High-end Resources", included: false },
                { text: "Priority Support", included: false },
            ],
            buttonText: "Get Started Free",
            popular: false,
        },
        {
            name: "Pro",
            price: "$19",
            period: "per month",
            description: "For serious developers who need unlimited power",
            features: [
                { text: "Unlimited Projects", included: true },
                { text: "Advanced Editor & Terminal", included: true },
                { text: "Live Preview", included: true },
                { text: "High-end Resources", included: true },
                { text: "Priority Support", included: true },
                { text: "Advanced Debugging Tools", included: true },
                { text: "Custom Environments", included: true },
                { text: "Team Collaboration", included: true },
            ],
            buttonText: "Start Pro Trial",
            popular: true,
        },
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Simple, Transparent
                        <span className="text-brand"> Pricing</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your development needs. Upgrade or downgrade at any time.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${plan.popular
                                    ? "border-brand bg-card scale-105 shadow-2xl shadow-brand/20"
                                    : "border-border bg-card hover:border-brand/50"
                                }`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            {/* Plan header */}
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">/{plan.period}</span>
                                </div>
                                <p className="text-muted-foreground">{plan.description}</p>
                            </div>

                            {/* Features list */}
                            <div className="space-y-4 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="flex items-center">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                                        )}
                                        <span
                                            className={
                                                feature.included
                                                    ? "text-foreground"
                                                    : "text-muted-foreground line-through"
                                            }
                                        >
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <Button
                                className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${plan.popular
                                        ? "bg-brand hover:bg-brand/90 text-white"
                                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                    }`}
                            >
                                {plan.buttonText}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Additional info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <p className="text-muted-foreground">
                        All plans include SSL certificates, automatic backups, and 99.9% uptime guarantee.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default Pricing;
