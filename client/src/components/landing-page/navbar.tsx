import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "../logo";
import LandingPageNavLinks from "./landing-page-nav-links";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

export default function Navbar() {

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/">
                        <Logo />
                    </Link>

                    <LandingPageNavLinks />

                    <Suspense fallback={<Skeleton className="h-10 w-28" />}>
                        <ActionButton />
                    </Suspense>
                </div>
            </div>
        </nav>
    );
};

async function ActionButton() {
    const session = await getServerSession(authOptions);

    return !session ? (
        <div className="flex items-center space-x-3">
            <Button
                variant="ghost"
                className="text-foreground hover:text-brand hover:bg-brand/10"
                asChild
            >
                <Link href={"/auth/login"}>
                    Login
                </Link>
            </Button>
            <Button
                className="bg-brand hover:bg-brand/90 text-white"
                asChild
            >
                <Link href="/auth/register">
                    Sign Up
                </Link>
            </Button>
        </div>
    ) : (
        <div className="flex items-center space-x-3">
            <Button
                className="bg-brand hover:bg-brand/90 text-white"
                asChild
            >
                <Link href="/workspace">
                    Workspace
                </Link>
            </Button>
        </div>
    )
}