"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
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

export interface IChatMessage {
    role: "agent" | "user",
    content: string,
}

interface AIChatContextType {
    messages: IChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>;
    isChatPending: boolean;
    streamingText: string;
    setStreamingText: React.Dispatch<React.SetStateAction<string>>;
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
    const [streamingText, setStreamingText] = useState("");
    const [isPending, setIsPending] = useState(false);

    const { mutateAsync } = useAppMutation();

    const podUrl = "http://localhost:3003";
    // const podUrl = process.env.NODE_ENV === 'production'
    //     ? `https://${replId}.${POD_DOMAIN}`
    //     : `http://${replId}.${POD_DOMAIN}`;

    useEffect(() => {
        const eventSource = new EventSource(`${podUrl}/stream`);

        let stream = "";
        eventSource.onmessage = function (event) {
            setIsPending(false);
            const data = event.data;

            if (data !== "Stream ended") {
                stream += data;
                setStreamingText(stream);
            } else {
                setMessages(prev => [...prev, { role: "agent", content: stream }]);
                setStreamingText("");
                stream = "";
            }
        };

        eventSource.onerror = function (error) {
            console.error('EventSource failed:', error);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    async function submitChatMessage(message: string) {
        setMessages(prev => [...prev, { role: "user", content: message }]);
        setIsPending(true);

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

    const contextValue = {
        messages,
        setMessages,
        isChatPending: isPending,
        streamingText,
        setStreamingText
    };

    return (
        <AIChatContext.Provider value={contextValue}>
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

