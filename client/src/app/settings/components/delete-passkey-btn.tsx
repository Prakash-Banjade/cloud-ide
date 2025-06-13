import { Button } from '@/components/ui/button'
import { ResponsiveAlertDialog } from '@/components/ui/responsive-alert-dialog'
import { useAppMutation } from '@/hooks/useAppMutation'
import { QueryKey } from '@/lib/query-keys'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

type Props = { credentialId: string }

export default function DeletePassKeyBtn({ credentialId }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const { mutateAsync, isPending } = useAppMutation()

    const handleDelete = async () => {
        mutateAsync({
            endpoint: `${QueryKey.WEB_AUTHN}/${credentialId}`,
            method: 'delete',
            invalidateTags: [QueryKey.WEB_AUTHN],
        })
    }

    return (
        <>
            <ResponsiveAlertDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                title="Delete Passkey"
                description="Are you sure you want to delete this passkey?"
                isLoading={isPending}
                action={handleDelete}
            />

            <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                type='button'
                title='Remove this passkey'
                aria-label='Remove this passkey'
                onClick={() => setIsOpen(true)}
            >
                <Trash2 />
                <span className="sr-only">Delete</span>
            </Button>
        </>
    )
}