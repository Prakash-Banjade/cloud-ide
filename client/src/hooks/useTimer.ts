import { useEffect, useRef, useState } from "react"

type UseTimerOptions = {
    startOnMount?: boolean
}

export default function useTimer(TIMER_SECONDS: number, options?: UseTimerOptions) {
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS * 1000)
    const [isRunning, setIsRunning] = useState(false)
    const startTimeRef = useRef(0)
    const requestRef = useRef<number>(0);

    const animate = (time: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = time
        }

        const elapsedTime = time - startTimeRef.current
        const newTimeLeft = Math.max((TIMER_SECONDS * 1000) - elapsedTime, 0)

        setTimeLeft(newTimeLeft)

        if (newTimeLeft > 0) {
            requestRef.current = requestAnimationFrame(animate)
        } else {
            setIsRunning(false)
        }
    }

    useEffect(() => {
        if (isRunning) {
            requestRef.current = requestAnimationFrame(animate)
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current)
            }
        }
    }, [isRunning])

    const startTimer = () => {
        setIsRunning(true)
        startTimeRef.current = 0
    }

    const resetTimer = () => {
        setIsRunning(false)
        setTimeLeft(TIMER_SECONDS * 1000)
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current)
        }
    }

    useEffect(() => {
        if (options && options.startOnMount === true) {
            startTimer();
        }
    }, []);

    return {
        timeLeft: Math.ceil(timeLeft / 1000),
        startTimer,
        resetTimer,
        isRunning,
    }
}