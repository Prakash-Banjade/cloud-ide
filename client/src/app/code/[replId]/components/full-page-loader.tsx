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
}

export default function FullPageLoader({ isLoadingRepl, isLoadingUser }: Props) {
    const { treeLoaded } = useCodingStates();
    const [currentState, setCurrentState] = React.useState(0);

    useEffect(() => {
        setCurrentState(
            isLoadingUser ? 0
                : isLoadingRepl ? 1
                    : treeLoaded ? 2
                        : 2
        )
    }, [isLoadingRepl, isLoadingUser, treeLoaded]);

    return (
        <MultiStepLoader
            currentStateValue={currentState}
            loadingStates={loadingStates}
            onStateChange={setCurrentState}
            loading={isLoadingRepl || isLoadingUser || !treeLoaded}
            duration={2000}
        />
    )
}