"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { TwoFactorAuthOTPVerificationForm } from "../../../../components/auth/login/2fa-otp-verification-form";

const locationSchema = z.object({
    expiresIn: z.number().positive(),
});

export default function Confirm2FAOTPPage() {
    const router = useRouter();
    const loginChallenge = sessionStorage.getItem("login-challenge");

    useEffect(() => {
        try {
            const { success } = locationSchema.safeParse(JSON.parse(sessionStorage.getItem("login-challenge") ?? ""));
            if (!success) return router.replace('/auth/login');
        } catch (e) {
            return router.replace('/auth/login');
        }
    }, []);

    if (!loginChallenge) return router.replace('/auth/login');

    const data = JSON.parse(sessionStorage.getItem("login-challenge") ?? "") as { expiresIn: number };

    return (
        <div className="h-screen mx-auto flex flex-col justify-center space-y-12 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="sm:text-3xl text-2xl font-semibold tracking-tight">
                    2-Step Verification
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please enter the OTP sent to your email.&nbsp;
                    <span className="font-semibold">OTP will expire in {Math.ceil((data.expiresIn ?? 0) / 60)} minutes</span>
                </p>
            </div>
            <TwoFactorAuthOTPVerificationForm />
        </div>
    )
}