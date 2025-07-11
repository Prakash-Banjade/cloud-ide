"use client";

import { useTransition } from "react"
import { useAppMutation } from "@/hooks/useAppMutation"
import LoadingButton from "../loading-button";
import { useRouter } from "next/navigation";

type Props = {
    email: string;
}

export function CancelButton({ email }: Props) {
    const [isPending, startTransition] = useTransition()

    const { mutateAsync } = useAppMutation();

    function cancelInvite() {
        startTransition(async () => {
            try {
                await mutateAsync({
                    endpoint: `/invites/cancel?email=${email}`,
                    method: 'delete',
                });
            } catch (e) {
                console.log(e);
            }
        })
    }

    return (
        <LoadingButton
            variant={'outline'}
            className="grow"
            onClick={cancelInvite}
            isLoading={isPending}
            loadingText='Cancelling...'
        >
            Cancel
        </LoadingButton>
    )
}

export function AcceptButton({ token, replId }: { token: string, replId: string }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter();
    const { mutateAsync } = useAppMutation();

    function acceptInvite() {
        startTransition(async () => {
            try {
                await mutateAsync({
                    endpoint: `/invites/accept?token=${token}`,
                    method: 'post',
                });

                router.push(`/code/${replId}`);
            } catch (e) {
                console.log(e)
            }
        });
    }

    return (
        <LoadingButton
            isLoading={isPending}
            className="grow bg-brand hover:bg-brand/90 text-white"
            loadingText='Accepting...'
            onClick={acceptInvite}
        >
            Accept
        </LoadingButton>
    )
}