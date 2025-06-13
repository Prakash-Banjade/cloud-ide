import { ProfileAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { School } from "lucide-react";
import { useSession } from "next-auth/react";
import { Skeleton } from "../ui/skeleton";
import { ConfirmByPasskey } from "./confirm-by-passkey";
import { ConfirmByPassword } from "./confirm-by-password";
import { useFetchData } from "@/hooks/useFetchData";
import { TWebAuthnCredential } from "@/types";
import { QueryKey } from "@/lib/query-keys";
import Logo from "../logo";

type Props = {
    setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SudoActionConfirmPage({ setIsVerified }: Props) {
    const { data } = useSession();
    const [confirmOption, setConfirmOption] = useState<'password' | 'passkey'>('password');

    const { data: credentials, isLoading } = useFetchData<TWebAuthnCredential[]>({
        queryKey: [QueryKey.WEB_AUTHN],
        endpoint: QueryKey.WEB_AUTHN,
    });

    useEffect(() => {
        if (credentials?.length) setConfirmOption('passkey');
    }, [credentials])

    if (isLoading) return <SudoAccessConfirmLoading />;

    return (
        <div className="h-screen max-h-[1000px] flex items-center justify-center">
            <div className="w-full max-w-md space-y-6 p-4">
                <div className="flex justify-center">
                    <Logo height={60} width={60} />
                </div>
                <h1 className="text-3xl text-center font-light">Confirm access</h1>

                <Card className="p-3">
                    <div className="flex items-center gap-3">
                        <ProfileAvatar src={undefined} name={data?.user.firstName + " " + data?.user.lastName} className="size-10" />
                        <div>
                            <span className="text-sm">Signed in as</span> <span className="font-medium">{data?.user.email}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-secondary/20">
                    {
                        confirmOption === 'passkey' ? (
                            <ConfirmByPasskey setIsVerified={setIsVerified} />
                        ) : (
                            <ConfirmByPassword setIsVerified={setIsVerified} />
                        )
                    }
                </Card>

                {
                    !!credentials?.length && <Card className="p-4 gap-0">
                        <h3 className="font-semibold mb-3">Having problems?</h3>
                        {
                            <button
                                type="button"
                                onClick={() => setConfirmOption(confirmOption === 'passkey' ? 'password' : 'passkey')}
                                className="w-fit text-sm text-blue-500 hover:underline"
                            >
                                {
                                    confirmOption === 'passkey' ? (
                                        <span>Use your password</span>
                                    ) : (
                                        <span>Use your passkey</span>
                                    )
                                }
                            </button>
                        }
                    </Card>
                }

                {/* Tip Section */}
                <p className="text-center text-sm text-muted-foreground">
                    You are entering sudo mode.
                </p>
            </div>
        </div>
    )
}

function SudoAccessConfirmLoading() {
    return (
        <div className="h-screen max-h-[1000px] flex items-center justify-center">
            <div className="w-full max-w-md space-y-6 p-4">
                {/* Title Skeleton */}
                <div className="flex justify-center">
                    <Skeleton className="h-9 w-48" />
                </div>

                {/* Profile Card Skeleton */}
                <Card className="p-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </Card>

                {/* Main Action Card Skeleton */}
                <Card className="p-6 bg-secondary/20">
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </Card>

                {/* Having Problems Card Skeleton */}
                <Card className="p-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-24" />
                </Card>

                {/* Tip Section Skeleton */}
                <div className="flex justify-center">
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        </div>
    )
}
