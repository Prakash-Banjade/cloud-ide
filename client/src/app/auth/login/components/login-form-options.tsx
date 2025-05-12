"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { LoginForm as LoginByPasswordForm } from "./login-by-pwd-form"
import { KeyRound, SquareAsterisk } from "lucide-react"
import { useState } from "react"
import { useCustomSearchParams } from "@/hooks/useCustomSearchParams"
import Link from "next/link"

type Props = {
    method: "password" | "passkey";
}

export default function LoginFormOptions({ method }: Props) {
    const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    const { setSearchParams } = useCustomSearchParams();

    return (
        <section>
            {
                method === "password" ? (
                    <LoginByPasswordForm setIsFormSubmitting={setIsFormSubmitting} />
                ) : (
                    // <LoginByPasskeyForm setIsFormSubmitting={setIsFormSubmitting} />
                    <></>
                )
            }

            <p className="text-sm text-muted-foreground mt-5 text-center">
                Don&apos;t have an account?&nbsp;

                <Link
                    href="/auth/register"
                    className={buttonVariants({ variant: 'link', className: '!p-0 h-fit' })}
                >
                    Create new
                </Link>
            </p>

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or
                    </span>
                </div>
            </div>

            <section className="space-y-2">
                {
                    method === "password" ? (
                        <Button
                            variant={"outline"}
                            disabled={isFormSubmitting}
                            type="button"
                            className="w-full"
                            onClick={() => !isFormSubmitting && setSearchParams("method", "passkey")}
                        >
                            <KeyRound className="h-4 w-4" />
                            Use passkey to login
                        </Button>
                    ) : (
                        <Button
                            variant={"outline"}
                            disabled={isFormSubmitting}
                            type="button"
                            className="w-full"
                            onClick={() => !isFormSubmitting && setSearchParams("method", "password")}
                        >
                            <SquareAsterisk className="h-4 w-4" />
                            Use password to login
                        </Button>
                    )
                }
            </section>
        </section>
    )
}