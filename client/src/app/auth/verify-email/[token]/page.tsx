import { redirect } from 'next/navigation';
import React, { Suspense } from 'react'
import { EmailVerificationForm } from '../../../../components/auth/verify-email/email-verification-form';
import axios from '@/lib/axios-server';

type Props = {
    params: {
        token: string
    }
}

export default async function VerifyEmailPage(props: { params: Promise<Props["params"]> }) {
    const { token } = await props.params;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Component token={token} />
        </Suspense>
    )
}

async function Component({ token }: Props["params"]) {
    try {
        const res = await axios.post("/auth/check-email-verification-token", { token });

        if (res.status !== 200) return redirect('/auth/login');
    } catch (e) {
        console.log(e);
        redirect('/auth/login');
    }

    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-6 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Verify Email
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please enter the OTP sent to your email
                </p>
            </div>

            <EmailVerificationForm verificationToken={token} />
        </div>
    )
}