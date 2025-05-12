import { Metadata } from "next"

import { z } from "zod"
import LoginFormOptions from "./components/login-form-options";

const loginMethodSchema = z.enum(["password", "passkey"]);

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to Qubide',
}

type Props = {
    searchParams: {
        method?: string
    }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Props["searchParams"]> }) {
    const { method } = await searchParams;

    const { success, data } = loginMethodSchema.safeParse(method ?? "password");

    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-10 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back!
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please sign in to your account
                </p>
            </div>

            <LoginFormOptions method={success ? data : "password"} />
        </div>
    )
}