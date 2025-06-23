"use client";

import { z } from "zod"
import LoginFormOptions from "./components/login-form-options";
import { use } from "react";

const loginMethodSchema = z.enum(["password", "passkey"]);

type Props = {
    searchParams: {
        method?: string
    }
}

export default function LoginPage({ searchParams }: { searchParams: Promise<Props["searchParams"]> }) {
    const { method } = use(searchParams);

    const { success, data } = loginMethodSchema.safeParse(method ?? "password");

    const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore") === "true";

    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-10 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome {hasLoggedInBefore ? "Back" : "To Qubide"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please sign in to your account
                </p>
            </div>

            <LoginFormOptions method={success ? data : "password"} />
        </div>
    )
}