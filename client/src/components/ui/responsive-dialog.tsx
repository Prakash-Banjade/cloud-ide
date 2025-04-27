import * as React from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function ResponsiveDialog({
    children,
    isOpen,
    setIsOpen,
    title,
    description,
    className
}: {
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    title: string;
    description?: string;
    className?: string;
}) {
    const isMobile = useIsMobile();

    if (!isMobile) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                {/* TODO: FIX THIS OVERFLOW STYLE USING SCROLLAREA */}
                <DialogContent className={cn('max-h-[97vh] overflow-y-auto', className)}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>
                    {children}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DrawerHeader>
                <section className='p-4'>
                    {children}
                </section>
            </DrawerContent>
        </Drawer>
    );
}