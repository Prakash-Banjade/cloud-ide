import { cn } from '@/lib/utils'
import Image from 'next/image'
import logoDark from '@/assets/logo-dark.png'
import logoWhite from '@/assets/logo-white.png'

type Props = {
    width?: number,
    height?: number,
    className?: string,
}

export default function Logo({ height = 40, width = 40, className }: Props) {
    return (
        <>
            <Image
                src={logoWhite}
                alt="logo"
                width={width}
                height={height}
                className={cn("dark:block hidden", className)}
                priority
            />
            <Image
                src={logoDark}
                alt="logo"
                width={width}
                height={height}
                className={cn("dark:hidden block", className)}
                priority
            />
        </>
    )
}