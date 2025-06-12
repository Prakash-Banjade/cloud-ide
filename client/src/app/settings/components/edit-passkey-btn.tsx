import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { useAppMutation } from '@/hooks/useAppMutation'
import { QueryKey } from '@/lib/query-keys'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import LoadingButton from '@/components/loading-button'


type Props = {
    credentialId: string,
    defaultName: string,
}

const editPasskeySchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
});

type editPasskeySchemaType = z.infer<typeof editPasskeySchema>;

export default function EditPassKeyBtn({ credentialId, defaultName }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<editPasskeySchemaType>({
        resolver: zodResolver(editPasskeySchema),
        defaultValues: {
            name: defaultName,
        }
    });

    const { mutateAsync, error, isPending } = useAppMutation();

    async function onSubmit(values: editPasskeySchemaType) {
        await mutateAsync({
            endpoint: `${QueryKey.WEB_AUTHN}/${credentialId}`,
            method: 'patch',
            data: values,
            toastOnError: false,
            invalidateTags: [QueryKey.WEB_AUTHN],
        })

        setIsOpen(false);
    }

    useEffect(() => { // show error directly in form field if send by server
        const errObj = (error as any)?.response?.data?.message;
        if (!!errObj?.field) {
            form.setError(errObj.field, { message: errObj?.message });
            form.setFocus(errObj.field);
        }
    }, [error])

    return (
        <div>
            <ResponsiveDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                title="Edit Passkey Nickname"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Passkey Nickname</FormLabel>
                                    <FormControl>
                                        <Input placeholder="eg. Right Thumb" {...field} required />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <section className='mt-4'>
                            <LoadingButton
                                isLoading={isPending}
                                type='submit'
                                loadingText='Updating...'
                            >
                                Update
                            </LoadingButton>
                        </section>
                    </form>
                </Form>
            </ResponsiveDialog>

            <Button
                variant="ghost"
                size="icon"
                type="button"
                title='Edit passkey nickname'
                aria-label='Edit passkey nickname'
                onClick={() => setIsOpen(true)}
            >
                <Pencil />
                <span className="sr-only">Edit</span>
            </Button>
        </div>
    )
}