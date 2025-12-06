import { Button } from "@/components/ui/button";
import { LoaderCircle, Paperclip, Send, X } from "lucide-react";
import { useCodingStates } from "@/context/coding-states-provider";
import { cn } from "@/lib/utils";
import { useAIChat } from ".";

export default function ChatInput({
    submitChatMessage,
}: {
    submitChatMessage: (message: string) => void,
}) {
    const { selectedFile } = useCodingStates();
    const { isStreaming, inputMessage, setInputMessage } = useAIChat();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        handleSend();
    }

    function handleSend() {
        if (!inputMessage || isStreaming) return;
        submitChatMessage(inputMessage);
        setInputMessage("");
    }

    return (
        <section className="@container">
            <form
                className={cn(
                    `w-full bg-sidebar-accent rounded-lg border @sm:p-4 p-2 transition-colors overflow-hidden`,
                    "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                )}
                onSubmit={handleSubmit}
                autoComplete="off"
                autoCapitalize="off"
            >
                {/* Top section with context and file tabs */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Paperclip className="w-4 h-4" />
                        <span className="sr-only">Add Context...</span>
                    </div>
                    {/* File tab */}
                    {
                        selectedFile && (
                            <div className="flex items-center gap-1 bg-blue-600/20 text-blue-200 px-2 py-1 rounded text-xs border border-blue-600/30">
                                <span>{selectedFile.name}</span>
                                <X className="w-3 h-3 cursor-pointer hover:text-blue-100" />
                            </div>
                        )
                    }
                </div>
                {/* Placeholder text replaced with actual input box */}
                <textarea
                    placeholder="Add context (#), extensions (@), commands (/)"
                    className="w-full field-sizing-content max-h-[200px] resize-none bg-transparent text-sm mb-4 outline-none border-none focus:ring-0"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                            e.preventDefault();
                            handleSend()
                            return;
                        }
                    }}
                />
                {/* Bottom controls */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Agent</span>
                    {/* Right side controls */}
                    <div className="ml-auto">
                        <Button
                            type="submit"
                            variant="ghost"
                            disabled={isStreaming}
                            size={'icon'}
                        >
                            {
                                isStreaming
                                    ? <LoaderCircle className="animate-spin" />
                                    : <Send className="w-4 h-4" />
                            }
                        </Button>
                    </div>
                </div>
            </form>
        </section>
    )
}