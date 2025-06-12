"use client";

import { Button } from "@/components/ui/button";
import { FileText, HelpCircle } from "lucide-react";
import Link from "next/link";
import Logo from "../logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Skeleton } from "../ui/skeleton";
import { ThemeToggle } from "../theme-toggle";

export default function Navbar() {
    const pathname = usePathname();
    const { data, status } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/">
                        <Logo />
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/docs"
                            className={cn(
                                "flex items-center space-x-2 text-foreground hover:text-dodgerblue transition-colors",
                                pathname === "/docs" && "text-dodgerblue"
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Documentation</span>
                        </Link>
                        <Link
                            href="/support"
                            className={cn(
                                "flex items-center space-x-2 text-foreground hover:text-dodgerblue transition-colors",
                                pathname === "/support" && "text-dodgerblue"
                            )}
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Support</span>
                        </Link>
                    </div>

                    {
                        status === "loading" ? (
                            <div className="flex items-center space-x-3">
                                <Skeleton className="size-10" />
                                <Skeleton className="h-10 w-28 rounded-md" />
                            </div>
                        ) : !data ? (
                            <div className="flex items-center space-x-3">
                                <ThemeToggle />
                                <Button
                                    variant="ghost"
                                    className="text-foreground hover:text-dodgerblue hover:bg-dodgerblue/10"
                                    asChild
                                >
                                    <Link href={"/auth/login"}>
                                        Login
                                    </Link>
                                </Button>
                                <Button
                                    className="bg-dodgerblue hover:bg-dodgerblue/90 text-white"
                                    asChild
                                >
                                    <Link href="/auth/register">
                                        Sign Up
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <ThemeToggle />
                                <Button
                                    className="bg-dodgerblue hover:bg-dodgerblue/90 text-white"
                                    asChild
                                >
                                    <Link href="/workspace">
                                        Workspace
                                    </Link>
                                </Button>
                            </div>
                        )
                    }
                </div>
            </div>
        </nav>
    );
};
