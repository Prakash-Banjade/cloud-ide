import { cn } from '@/lib/utils'
import Image from 'next/image'

type Props = {
    width?: number,
    height?: number,
    className?: string,
}

export default function Logo({ height = 40, width = 40, className }: Props) {
    return (
        <>
            <Image
                src={"/logo-white.png"}
                alt="logo"
                width={width}
                height={height}
                className={cn("dark:block hidden", className)}
                priority
            />
            <Image
                src={"/logo-dark.png"}
                alt="logo"
                width={width}
                height={height}
                className={cn("dark:hidden block", className)}
                priority
            />
        </>
    )
}