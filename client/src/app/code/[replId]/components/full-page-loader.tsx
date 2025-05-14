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
    isLoadingRepl: boolean
}

export default function FullPageLoader({ isLoadingRepl, isLoadingUser }: Props) {
    const [currentState, setCurrentState] = React.useState(0);
    const { loaded } = useCodingStates();

    useEffect(() => {
        console.log(isLoadingUser, isLoadingRepl, loaded);
        if (isLoadingUser) return setCurrentState(0);
        if (isLoadingRepl) return setCurrentState(1);
        if (!loaded) return setCurrentState(2);
    }, [isLoadingRepl, isLoadingUser, loaded]);

    return (
        <MultiStepLoader
            currentStateValue={currentState}
            loadingStates={loadingStates}
            onStateChange={setCurrentState}
            loading={isLoadingRepl || isLoadingUser || !loaded}
        />
    )
}