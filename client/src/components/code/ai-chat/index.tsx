"use client";

import React, { useState, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ChatInput from "./chat-input";
import ChatContent from "./chat-content";

interface IChatMessage {
    role: "agent" | "user",
    content: string,
}

interface AIChatContextType {
    messages: IChatMessage[],
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>
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

    return (
        <AIChatContext.Provider value={{ messages, setMessages }}>
            <div className="bg-sidebar h-full flex flex-col">

                {/* Header */}
                <div className="p-1 flex items-center justify-between">
                    <h2 className="px-2">Chat</h2>

                    <Button type="button" title={"Close Chat"} variant={"ghost"} size={'icon'}>
                        <X />
                    </Button>
                </div>

                {/* Chat Content */}
                <div className="flex-1">
                    <ChatContent />
                </div>

                {/* Chat Input */}
                <section className="p-1.5">
                    <ChatInput />
                </section>

            </div>
        </AIChatContext.Provider>
    );
}

