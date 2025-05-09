import { useState, useEffect } from "react"

const usePersist = () => {
    const [persist, setPersist] = useState<boolean>(JSON.parse(localStorage.getItem("persist") ?? 'false') || false);

    useEffect(() => {
        localStorage.setItem("persist", JSON.stringify(persist))
    }, [persist])

    return {
        persist,
        setPersist
    }
}
export default usePersist;