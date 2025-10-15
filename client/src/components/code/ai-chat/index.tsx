"use client";

import React, { useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ChatInput from "./chat-input";
import ChatContent from "./chat-content";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface IChatMessage {
    role: "agent" | "user",
    content: string,
}

export interface StreamEvent {
    type: string;
    agent?: string;
    data?: any;
    message?: string;
    timestamp: string;
}

export interface StreamProgressStep {
    id: string;
    type: string;
    agent?: string;
    message: string;
    acknowledged?: boolean;
}

interface AIChatContextType {
    messages: IChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>;
    isChatPending: boolean;
    streamingText: string;
    setStreamingText: React.Dispatch<React.SetStateAction<string>>;
    isStreaming: boolean;
    progressSteps: StreamProgressStep[];
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
    const [streamingText, setStreamingText] = useState("");
    const streamingTextRef = useRef("");
    const [isChatPending, setIsChatPending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [progressSteps, setProgressSteps] = useState<StreamProgressStep[]>([]);
    const progressStepsRef = useRef<StreamProgressStep[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);

    const podUrl = React.useMemo(() => {
        const domain = process.env.NEXT_PUBLIC_POD_DOMAIN;
        if (process.env.NODE_ENV === "production" && replId && domain) {
            return `https://${replId}.${domain}`;
        }
        return "http://localhost:3003";
    }, [replId]);

    useEffect(() => {
        streamingTextRef.current = streamingText;
    }, [streamingText]);

    useEffect(() => {
        progressStepsRef.current = progressSteps;
    }, [progressSteps]);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    const closeStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsStreaming(false);
    };

    const acknowledgeConnection = useCallback(() => {
        setProgressSteps(prev => {
            if (prev.length === 0) return prev;
            const firstStep = prev[0];
            if (firstStep.type !== "connection" || firstStep.acknowledged) return prev;
            const next = [...prev];
            next[0] = { ...firstStep, acknowledged: true, message: "Connected. Processing your request..." };
            return next;
        });
    }, []);

    const appendProgressStep = useCallback((event: StreamEvent) => {
        if (!event.message) return;
        const id = `${event.timestamp}-${event.type}-${event.agent ?? ""}`;
        setProgressSteps(prev => {
            if (prev.some(step => step.id === id)) {
                return prev;
            }

            const agentLabel = event.agent
                ? event.agent.charAt(0).toUpperCase() + event.agent.slice(1)
                : undefined;

            return [
                ...prev,
                {
                    id,
                    type: event.type,
                    agent: agentLabel,
                    message: event.message,
                },
            ];
        });
    }, []);

    const handleStreamEvent = (event: StreamEvent) => {
        acknowledgeConnection();
        appendProgressStep(event);

        switch (event.type) {
            case "direct_response_complete":
                if (event.data?.response) {
                    setStreamingText(event.data.response);
                }
                break;
            case "complete":
                if (streamingTextRef.current) {
                    setMessages(prev => [...prev, { role: "agent", content: streamingTextRef.current }]);
                    setStreamingText("");
                    streamingTextRef.current = "";
                } else {
                    const lastStep = progressStepsRef.current[progressStepsRef.current.length - 1];
                    const fallback = event.message || lastStep?.message;
                    const completionMessage = fallback ?? "Agent run complete.";
                    setMessages(prev => [...prev, { role: "agent", content: completionMessage }]);
                }
                setIsChatPending(false);
                setProgressSteps([]);
                closeStream();
                break;
            case "error":
                setIsChatPending(false);
                const lastStep = progressStepsRef.current[progressStepsRef.current.length - 1];
                const errorMessage = event.message || lastStep?.message || "Something went wrong.";
                setMessages(prev => [...prev, { role: "agent", content: errorMessage }]);
                setProgressSteps([]);
                closeStream();
                break;
        }
    };

    const startStreaming = (prompt: string) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        const url = `${podUrl}/vibe/stream?user_prompt=${encodeURIComponent(prompt)}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data: StreamEvent = JSON.parse(event.data);
                handleStreamEvent(data);
            } catch (error) {
                console.error("Error parsing stream event", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("EventSource failed:", error);
            toast.error("Connection lost while streaming.");
            setProgressSteps(prev => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    type: "connection_error",
                    message: "Connection lost. Please try again.",
                },
            ]);
            setIsChatPending(false);
            setStreamingText("");
            streamingTextRef.current = "";
            setMessages(prev => [...prev, { role: "agent", content: "Connection lost. Please try again." }]);
            setProgressSteps([]);
            closeStream();
        };
    };

    function submitChatMessage(message: string) {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            return;
        }

        setMessages(prev => [...prev, { role: "user", content: trimmedMessage }]);
        setStreamingText("");
        streamingTextRef.current = "";

        setIsChatPending(true);
        setIsStreaming(true);
        setProgressSteps([
            {
                id: `connecting-${Date.now()}`,
                type: "connection",
                message: "Connecting to the agent...",
                acknowledged: false,
            },
        ]);

        startStreaming(trimmedMessage);
    }

    const contextValue = {
        messages,
        setMessages,
        isChatPending,
        streamingText,
        setStreamingText,
        isStreaming,
        progressSteps,
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

