"use client";

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { Inbox, KeyRound, LoaderCircle, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppMutation } from '@/hooks/useAppMutation';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { ResponsiveAlertDialog } from '@/components/ui/responsive-alert-dialog';
import ChangePasswordForm from './change-password.form';
import { useRouter } from 'next/navigation';
import PassKeysList from './passkey-lis';
import { useFetchData } from '@/hooks/useFetchData';

export default function PasswordAndAuthentication() {
    const router = useRouter()

    return (
        <ScrollArea className='@5xl:h-[80vh] @5xl:overflow-hidden @5xl:pr-10'>
            <section className='px-1'>
                <h2 className="text-2xl font-medium mb-4">Change Password</h2>

                <ChangePasswordForm />
            </section>

            <Separator className='my-12' />

            <section className='px-1'>
                <header className="flex justify-between items-center gap-10 mb-4">
                    <h2 className="text-2xl font-medium">Passkeys</h2>

                    <Button
                        variant={'outline'}
                        size={'sm'}
                        type="button"
                        onClick={() => router.push(`/passkey/new`)}
                    >
                        <Plus /> Add a Passkey
                    </Button>
                </header>

                <p className="@lg:text-sm text-xs text-muted-foreground">
                    Passkeys are WebAuthn credentials that verify your identity through methods like touch, facial recognition,
                    a device password, or a PIN. They can serve as an alternative to passwords or be used for two-factor authentication (2FA)
                </p>

                <PassKeysList />

            </section>

            <Separator className='my-12' />

            <TwoFaSection />
        </ScrollArea>
    )
}

function TwoFaSection() {
    const TWOFA_STATUS = "accounts/2fa/status";

    const { data, isLoading } = useFetchData<{ twoFaEnabledAt: string | null }>({
        endpoint: TWOFA_STATUS,
        queryKey: [TWOFA_STATUS],
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { mutateAsync, isPending } = useAppMutation();

    const handleCheckboxChange = async (val: boolean) => {
        const response = await mutateAsync({
            endpoint: "accounts/2fa/toggle",
            method: 'patch',
            data: { toggle: val },
            invalidateTags: [TWOFA_STATUS],
            toastOnSuccess: false,
        });

        if (response.status === 200 && val) {
            toast.success('2-Step Verification is now enabled')
        }
    }

    return (
        <section className='px-1'>
            <h2 className="text-2xl font-medium mb-4">2-Step Verification</h2>

            <p className="@lg:text-sm text-xs text-muted-foreground">
                Add an extra layer of security to your account with 2-Step Verification. When a new device is detected, you&apos;ll be asked prompted to go through an extra layer of security via email or passkey.
            </p>

            <ResponsiveAlertDialog
                action={() => handleCheckboxChange(false)}
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                title='Disable 2-Step Verification?'
                actionLabel='Yes, Disable'
                description='Are you sure you want to disable 2-Step Verification? This will remove the 2-Step Verification from your account.'
                isLoading={isPending}
                loadingText='Disabling...'
            />

            {
                !isLoading ? (
                    <section className='mt-5 border rounded-md flex gap-3 p-4'>
                        {
                            !isPending ? (
                                <Checkbox
                                    id="toggle-2fa"
                                    aria-labelledby='label-2fa'
                                    checked={!!data?.twoFaEnabledAt}
                                    onCheckedChange={val => val ? handleCheckboxChange(true) : setIsDialogOpen(true)}
                                    disabled={isPending}
                                />
                            ) : (
                                <LoaderCircle size={16} className='animate-spin opacity-90' />
                            )
                        }
                        <div className='space-y-1'>
                            <label htmlFor='toggle-2fa' id="label-2fa" className='block font-medium leading-none'>2-Step Verification</label>
                            <p className='text-sm text-muted-foreground'>Enable or disable the 2-Step Verification</p>
                        </div>
                    </section>
                ) : ( // loading skeleton
                    <div className="w-full mt-5 p-4 space-y-2 border rounded-md">
                        <div className="flex items-start gap-4">
                            <div className="size-5 rounded bg-muted animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-64 bg-muted rounded animate-pulse opacity-70" />
                            </div>
                        </div>
                    </div>
                )
            }

            <section className='mt-5 border rounded-md'>
                <h3 className='font-medium bg-secondary/20 p-4 border-b'>Two-factor methods</h3>
                <ul className='space-y-4 p-4'>
                    <li className='w-full flex flex-col gap-2'>
                        <span className="flex items-center gap-4 font-medium">
                            <Inbox size={20} /> Email
                        </span>
                        <span className="text-xs ml-10 text-left text-muted-foreground">
                            An OTP will be sent to your email. You will be prompted to enter that OTP to complete the 2-Step Verification.
                        </span>
                    </li>
                    <li className='w-full flex flex-col gap-2'>
                        <span className="flex items-center gap-4 font-medium">
                            <KeyRound size={20} /> Passkey
                        </span>
                        <span className="text-xs ml-10 text-left text-muted-foreground">
                            If you have registered a passkey, you will be prompted to use it for 2-Step Verification.
                        </span>
                    </li>
                </ul>
            </section>
        </section>
    )
}