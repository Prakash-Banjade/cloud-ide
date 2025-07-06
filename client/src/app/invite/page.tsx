import { AcceptButton, CancelButton } from "@/components/invite/action-btns";
import Footer from "@/components/layout/footer";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { serverFetch } from "@/lib/axios-server";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
    searchParams: Promise<{
        token?: string;
        action?: "accept" | string;
    }>
}

type InviteDetail = {
    id: string,
    email: string,
    project: {
        id: string,
        name: string,
        replId: string,
        createdBy: {
            id: string,
            account: {
                id: string,
                email: string,
                firstName: string,
                lastName: string,
            }
        }
    }
}

export default async function InvitePage({ searchParams }: Props) {
    const { token, action } = await searchParams;

    if (!token) return redirect("/workspace");

    const res = await serverFetch(`/invites/details?token=${token}`);

    const data = await res.json();

    if (!res.ok) {
        const msg = typeof data.message?.message === 'string' ? data.message.message : 'Something went wrong. Please contact the support team.';

        return (
            <section className="flex flex-col items-center justify-center gap-4 h-screen">
                <p className="text-center">{msg}</p>
                <Button
                    className="bg-brand hover:bg-brand/90 mt-4 text-white"
                    asChild
                >
                    <Link href="/workspace">Workspace</Link>
                </Button>
            </section>
        )
    };

    if (action === "accept") {
        const res = await serverFetch(`/invites/accept?token=${token}`, { method: "POST" });
        const data = await res.json();

        if (res.status !== 200) {
            const msg = typeof data.message?.message === 'string' ? data.message.message : 'Something went wrong. Please contact the support team.';

            return (
                <section className="flex flex-col items-center justify-center gap-4 h-screen">
                    <p className="text-center">{msg}</p>
                    <Button
                        className="bg-brand hover:bg-brand/90 mt-4 text-white"
                        asChild
                    >
                        <Link href="/workspace">Workspace</Link>
                    </Button>
                </section>
            )
        }

        // invitation is accepted, redirect to repl
        redirect('/code/' + data.replId);
    }

    const inviteDetail = data as InviteDetail;

    const createdBy = inviteDetail.project.createdBy.account.firstName + ' ' + inviteDetail.project.createdBy.account.lastName;

    return (
        <div className="flex flex-col gap-4 h-screen">
            <section className="grow flex flex-col items-center justify-center gap-4">
                <Logo
                    height={60}
                    width={60}
                />

                <p className="mt-10"><span className="font-medium">{createdBy}</span> has invited you to their project <strong>{inviteDetail.project.name}</strong></p>

                <section className="flex items-center gap-4 min-w-sm">
                    <CancelButton email={inviteDetail.email} />
                    <AcceptButton token={token} replId={inviteDetail.project.replId} />
                </section>

                <p className="mt-10">If you have any questions, please contact <a href={`mailto:${inviteDetail.project.createdBy.account.email}`} className="underline hover:text-brand">{inviteDetail.project.createdBy.account.email}</a>.</p>

            </section>
            <Footer />
        </div>
    )
}