import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Login',
    description: 'Login to Qubide',
}

type Props = {
    children: React.ReactNode
}

export default function LoginPageLayout({ children }: Props) {
    return children;
}