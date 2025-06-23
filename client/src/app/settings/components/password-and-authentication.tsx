"use client";

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChangePasswordForm from './change-password.form';
import PassKeysList from './passkey-lis';
import TwoFaSection from './2fa-section';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PasswordAndAuthentication() {
    const { status } = useSession();

    if (status === "loading") return <LoadingSkeleton />;

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
                        asChild
                    >
                        <Link href="/passkey/new">
                            <Plus /> Add a Passkey
                        </Link>
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

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            {/* Change Password Section */}
            <div className="space-y-5">
                {/* Title */}
                <Skeleton className="h-8 w-48" />

                {/* Password Fields */}
                <div className="space-y-4">
                    {/* First Password Field */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>

                    {/* Second Password Field */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>

                    {/* Third Password Field */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                </div>

                {/* Logout Checkbox Section */}
                <div className="flex items-start space-x-3 p-4 border rounded-md">
                    <Skeleton className="h-4 w-4 rounded-sm mt-1" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-80" />
                    </div>
                </div>

                {/* Change Password Button */}
                <Skeleton className="h-10 w-36 rounded-md" />
            </div>

            {/* Divider */}
            <div className="border-t my-8"></div>

            {/* Passkeys Section */}
            <div className="space-y-6">
                {/* Passkeys Header */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>

                {/* Passkeys Description */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Passkey Item */}
                <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-6 w-6 rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}
