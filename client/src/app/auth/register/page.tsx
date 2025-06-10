import { Metadata } from 'next'
import React from 'react'
import { SignUpForm } from './components/signup-form'

export const metadata: Metadata = {
    title: 'Register',
    description: 'Register to Qubide',
}

export default function RegisterPage() {
    return (
        <div className="lg:p-8 h-screen mx-auto flex flex-col justify-center space-y-10 w-[90%] max-w-[600px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Register To Qubide
                </h1>
                <p className="text-sm text-muted-foreground">
                    Fill the form to register your account
                </p>
            </div>

            <SignUpForm />
        </div>
    )
}