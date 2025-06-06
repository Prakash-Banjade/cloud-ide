import { MultiStepLoader } from '@/components/ui/multi-step-loader'
import { useCodingStates } from '@/context/coding-states-provider';
import React, { useEffect } from 'react'

const loadingStates = [
    {
        text: "Validating User",
    },
    {
        text: "Booting repl",
    },
    {
        text: "Loading your files",
    }
]

type Props = {
    isLoadingUser: boolean,
    isLoadingRepl: boolean,
    isLoaded: boolean
}

export default function FullPageLoader({ isLoadingRepl, isLoadingUser, isLoaded }: Props) {
    const [currentState, setCurrentState] = React.useState(0);

    useEffect(() => {
        setCurrentState(
            isLoadingUser ? 0
                : isLoadingRepl ? 1
                    : isLoaded ? 2
                        : 2
        )
    }, [isLoadingRepl, isLoadingUser, isLoaded]);

    return (
        <MultiStepLoader
            currentStateValue={currentState}
            loadingStates={loadingStates}
            onStateChange={setCurrentState}
            loading={isLoadingRepl || isLoadingUser || !isLoaded}
            duration={2000}
        />
    )
}