import RequireSudo from "@/components/passkey/require-sudo"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Passkey',
    description: 'Configure your passkey.',
}

type Props = {
    children: React.ReactNode
}

export default function PasskeyLayout({ children }: Props) {
    return (
        <RequireSudo>
            {children}
        </RequireSudo>
    )
}