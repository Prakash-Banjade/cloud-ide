import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function useCustomSearchParams() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get a new searchParams string by merging the current
    // searchParams with a provided key/value pair
    const createQueryString = useCallback(
        (name: string, value: string | undefined | null) => {
            const params = new URLSearchParams(searchParams.toString())

            if (!!value) {
                params.set(name, value)
            } else {
                params.delete(name)
            }

            return params.toString()
        },
        [searchParams]
    )

    function setSearchParams(name: string, value: string | undefined | null) {
        const params = createQueryString(name, value)
        router.push(
            params.length > 0
                ? `${pathname}?${params}`
                : pathname
        );
    }

    return { searchParams, setSearchParams }
}