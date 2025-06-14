"use client";

import { cn } from "@/lib/utils";
import { FileText, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LandingPageNavLinks() {
    const pathname = usePathname();

    return (
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
    )
}