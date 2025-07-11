import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import axios, { AxiosError } from "axios"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { API_URL, getErrMsg } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import useTimer from "@/hooks/useTimer"
import { AuthMessage, RESEND_OTP_TIME_SEC } from "@/lib/CONSTANTS"
import { TLoginResponse } from "@/types/types"
import LoadingButton from "@/components/loading-button"
import { signIn } from "next-auth/react"

const FormSchema = z.object({
    otp: z.string().min(6, {
        message: "Your one-time password must be 6 characters.",
    }),
    verificationToken: z.string().min(1),
});

type FormValues = z.infer<typeof FormSchema>

export function TwoFactorAuthOTPVerificationForm() {
    const { token } = useParams();
    const router = useRouter();
    const [resendMessage, setResendMessage] = useState('');
    const [isPending, startTransition] = useTransition();
    const { resetTimer, timeLeft, startTimer, isRunning } = useTimer(RESEND_OTP_TIME_SEC, { startOnMount: true });

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            otp: "",
            verificationToken: token as string ?? "",
        },
    });

    const { mutateAsync } = useMutation({
        mutationFn: (data: FormValues) => axios.post<TLoginResponse>(`${API_URL}/auth/verify-two-fa-otp`, data, { withCredentials: true }),
        onError: (error) => {
            if (error instanceof AxiosError) {
                const errorMsg = error.response?.data?.message;

                if ('error' in errorMsg && errorMsg.error === AuthMessage.TOKEN_EXPIRED) {
                    router.replace('/auth/login')
                }

                if (errorMsg?.message) {
                    toast.error(errorMsg.message);
                }

                if (typeof errorMsg === 'string') {
                    toast.error(errorMsg);
                }
            } else {
                toast.error(error.message);
            }
        },
        async onSuccess(res) { // after successful handle, login the user
            const data = res.data;

            if (!data.access_token) {
                toast.error("An error occurred during sign in");
                return;
            }

            const result = await signIn("credentials", {
                ...data,
                redirect: false,
            });

            if (result?.status === 401) {
                toast.error("Invalid email or password");
                return;
            }

            router.push("/workspace");
            router.refresh();
        }
    });

    const { mutateAsync: resend, isPending: isResendPending } = useMutation({
        mutationFn: () => axios.post(`${API_URL}/auth/resend-two-fa-otp`, { verificationToken: token }),
        onSuccess: (data) => {
            const { token, expiresIn } = data.data as { token: string, expiresIn: number }

            if (token) {
                setResendMessage('A new OTP has been sent to your email.');
                form.setValue('verificationToken', token);
                resetTimer();
                startTimer();
                sessionStorage.setItem("login-challenge", JSON.stringify({ time: Date.now(), expiresIn })); // time is to keep track of timer
                router.push(`/auth/login/challenge/${token}`);

                // clear after 10s
                setTimeout(() => {
                    setResendMessage('');
                }, 10 * 1000)
            }
        },
        onError(e) {
            toast.error(getErrMsg(e) ?? 'Failed to send OTP');
        }
    });

    function onSubmit(data: FormValues) {
        if (isResendPending) return;

        startTransition(async () => {
            await mutateAsync(data);
        })
    }

    function resendOtp() {
        if (isPending) return;
        resend();
    }

    if (!token) router.replace('/auth/login');

    return (
        <section>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center gap-6">
                    <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center">
                                <FormControl>
                                    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field}>
                                        <InputOTPGroup>
                                            <InputOTPSlot className="size-12" index={0} />
                                            <InputOTPSlot className="size-12" index={1} />
                                            <InputOTPSlot className="size-12" index={2} />
                                            <InputOTPSlot className="size-12" index={3} />
                                            <InputOTPSlot className="size-12" index={4} />
                                            <InputOTPSlot className="size-12" index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <LoadingButton
                        isLoading={isPending}
                        type="submit"
                        loadingText="Verifying..."
                        disabled={isResendPending || isPending}
                        className="w-[200px]"
                    >
                        Submit
                    </LoadingButton>
                </form>

                <section className="mt-6 flex items-center justify-center">
                    {
                        timeLeft > 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Resend In: {timeLeft}s
                            </p>
                        ) : (
                            <Button
                                type="button"
                                variant={'link'}
                                onClick={resendOtp}
                                disabled={isResendPending || isPending || isRunning}
                                className="p-0 h-fit"
                            >
                                Resend OTP
                            </Button>
                        )
                    }
                </section>

                {
                    !!resendMessage && (
                        <p className="text-success text-sm text-center bg-success/10 p-2 rounded-md mt-4">
                            {resendMessage}
                        </p>
                    )
                }
            </Form>
        </section>
    )
}
