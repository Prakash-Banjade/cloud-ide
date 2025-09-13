import { useAIChat } from "."

export default function ChatContent() {
    const { messages } = useAIChat();

    if (messages.length === 0) return (
        <div className="@container h-full grid place-items-center">
            <div>
                <h3 className="font-bold text-center @md:text-3xl text-2xl mb-2">Build with agent mode</h3>
                <p className="text-center text-sm text-muted-foreground">AI responses may be inaccurate</p>
            </div>
        </div>
    );

    return (
        <div>ChatContent</div>
    )
}