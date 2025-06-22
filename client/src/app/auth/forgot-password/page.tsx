import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Forgot Password',
    description: 'Reset your password',
}

export default function ForgotPasswordPage() {
    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-6 w-[90%] max-w-[600px]">
            <div className="flex flex-col text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot Password
                </h1>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}