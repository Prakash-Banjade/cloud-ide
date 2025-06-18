import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function HeroGetStartedButton() {
    const session = await getServerSession(authOptions);

    return !session ? (
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