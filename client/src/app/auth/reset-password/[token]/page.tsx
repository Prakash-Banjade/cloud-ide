import ResetPasswordForm from "@/components/auth/reset-password-form";
import axiosServer from "@/lib/axios-server";
import { QueryKey } from "@/lib/query-keys";
import { Metadata } from "next";
import { redirect, RedirectType } from "next/navigation";

export const metadata: Metadata = {
    title: 'Reset Password',
    description: 'Reset your password',
}

type Props = {
    params: { token: string };
}

export default async function ResetPasswordPage({ params }: { params: Promise<Props['params']> }) {
    const { token } = await params;

    try {
        await axiosServer.post(`/${QueryKey.AUTH_VERIFY_PWD_RESET_TOKEN}`, { token });
    } catch (e) {
        console.error(e);
        redirect('/auth/login', RedirectType.replace);
    }

    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-6 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Reset Password
                </h1>
                <p className="text-muted-foreground">
                    Please enter your new password and confirm it.
                </p>
            </div>
            <ResetPasswordForm token={token} />
        </div>
    )
}