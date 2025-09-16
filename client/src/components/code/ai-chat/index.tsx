"use client";

import React, { useState, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ChatInput from "./chat-input";
import ChatContent from "./chat-content";
import { useAppMutation } from "@/hooks/useAppMutation";
import toast from "react-hot-toast";
import { POD_DOMAIN } from "@/lib/CONSTANTS";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCodingStates } from "@/context/coding-states-provider";

interface IChatMessage {
    role: "agent" | "user",
    content: string,
}

interface AIChatContextType {
    messages: IChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>;
    isChatPending: boolean;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const useAIChat = () => {
    const context = useContext(AIChatContext);
    if (context === undefined) {
        throw new Error('useAIChat must be used within a AIChatProvider');
    }
    return context;
}

export default function AIChat() {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const { replId } = useParams();
    const { selectedFile } = useCodingStates();

    const { mutateAsync, isPending } = useAppMutation();

    const podUrl = "http://localhost:3003";
    // const podUrl = process.env.NODE_ENV === 'production'
    //     ? `https://${replId}.${POD_DOMAIN}`
    //     : `http://${replId}.${POD_DOMAIN}`;

    async function submitChatMessage(message: string) {
        setMessages(prev => [...prev, { role: "user", content: message }]);

        try {
            const res = await mutateAsync({
                endpoint: `${podUrl}/vibe/chat`,
                method: "post",
                data: {
                    message: message,
                    selectedFilePath: selectedFile?.path,
                    contextSelection: 'repo'
                },
                toastOnSuccess: false,
                config: {
                    timeout: undefined
                }
            });

            if (typeof res.data === 'string') {
                setMessages(prev => [...prev, { role: "agent", content: res.data as string }]);
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        }
    }

    return (
        <AIChatContext.Provider value={{ messages, setMessages, isChatPending: isPending }}>
            <div className="bg-sidebar h-full flex flex-col">

                {/* Header */}
                <div className="p-1 flex items-center justify-between">
                    <h2 className="px-2">Chat</h2>

                    <Button type="button" title={"Close Chat"} variant={"ghost"} size={'icon'}>
                        <X />
                    </Button>
                </div>

                {/* Chat Content */}
                <ScrollArea className="flex-1 flex overflow-auto">
                    <ChatContent />
                </ScrollArea>

                {/* Chat Input */}
                <section className="p-1.5">
                    <ChatInput submitChatMessage={submitChatMessage} />
                </section>

            </div>
        </AIChatContext.Provider>
    );
}

