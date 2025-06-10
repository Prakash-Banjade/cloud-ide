import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import LoadingButton from "../loading-button";

export function ResponsiveAlertDialog({
    isOpen,
    setIsOpen,
    title,
    description,
    className,
    action,
    actionLabel = "Sure",
    isLoading = false,
    loadingText = "Deleting...",
}: {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    title: string;
    description?: string;
    className?: string;
    action: () => void;
    actionLabel?: string;
    isLoading?: boolean;
    loadingText?: string;
}) {
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className={className}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {
                        description && (
                            <AlertDialogDescription>{description}</AlertDialogDescription>
                        )
                    }
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <LoadingButton
                        isLoading={isLoading}
                        loadingText={loadingText}
                        type="button"
                        variant={"destructive"}
                        onClick={async () => {
                            await action();
                            setIsOpen(false);
                        }}
                    >
                        {actionLabel}
                    </LoadingButton>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}