import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Support',
    description: 'Get help with Qubide.',
}

export default function SupportPage() {
    return (
        <section className="p-8 container mx-auto">
            <h1 className="text-3xl font-semibold mb-6">Get Support</h1>

            <p>For any support or queries, please contact the developer at <a href="mailto:prakashbanjade@qubide.cloud" className="underline underline-offset-2 hover:text-brand">prakashbanjade@qubide.cloud</a>.</p>
        </section>
    )
}