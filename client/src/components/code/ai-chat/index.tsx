"use client";

import React, { useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ChatInput from "./chat-input";
import ChatContent from "./chat-content";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import useUrl from "@/hooks/useUrl";
import { EPanel, useCodingStates } from "@/context/coding-states-provider";

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

type RouteChoice = "agent" | "direct" | null;

interface AIChatContextType {
    messages: IChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>;
    isChatPending: boolean;
    streamingText: string;
    setStreamingText: React.Dispatch<React.SetStateAction<string>>;
    isStreaming: boolean;
    progressSteps: StreamProgressStep[];
    route: RouteChoice;
    submitChatMessage: (message: string) => void;
    inputMessage: string;
    setInputMessage: React.Dispatch<React.SetStateAction<string>>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const useAIChat = () => {
    const context = useContext(AIChatContext);
    if (context === undefined) {
        throw new Error('useAIChat must be used within a AIChatProvider');
    }
    return context;
}

export default function AIChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [streamingText, setStreamingText] = useState("");
    const streamingTextRef = useRef("");
    const [isChatPending, setIsChatPending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [progressSteps, setProgressSteps] = useState<StreamProgressStep[]>([]);
    const [route, setRoute] = useState<RouteChoice>(null);
    const progressStepsRef = useRef<StreamProgressStep[]>([]);
    const routeRef = useRef<RouteChoice>(null);
    const pendingProgressRef = useRef<StreamProgressStep[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const [inputMessage, setInputMessage] = useState("")

    const { runnerUrl } = useUrl();

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

    const appendProgressStep = useCallback((event: StreamEvent) => {
        if (!event.message) return;
        const id = `${event.timestamp}-${event.type}-${event.agent ?? ""}`;
        const agentLabel = event.agent
            ? event.agent.charAt(0).toUpperCase() + event.agent.slice(1)
            : undefined;

        const step: StreamProgressStep = {
            id,
            type: event.type,
            agent: agentLabel,
            message: event.message,
        };

        const currentRoute = routeRef.current;

        if (currentRoute === "direct") {
            return;
        }

        if (currentRoute === "agent") {
            setProgressSteps(prev => {
                if (prev.some(existing => existing.id === id)) {
                    return prev;
                }
                return [...prev, step];
            });
            return;
        }

        if (!pendingProgressRef.current.some(existing => existing.id === id)) {
            pendingProgressRef.current = [...pendingProgressRef.current, step];
        }
    }, []);

    const promotePendingProgress = useCallback(() => {
        if (pendingProgressRef.current.length === 0) {
            return;
        }

        setProgressSteps(prev => {
            const next = [...prev];
            for (const step of pendingProgressRef.current) {
                if (!next.some(existing => existing.id === step.id)) {
                    next.push(step);
                }
            }
            return next;
        });

        pendingProgressRef.current = [];
    }, []);

    const handleStreamEvent = (event: StreamEvent) => {
        if (event.type === "router_decision" && event.data?.route) {
            const routeChoice: RouteChoice = event.data.route === "direct" ? "direct" : "agent";
            setRoute(routeChoice);
            routeRef.current = routeChoice;

            if (routeChoice === "agent") {
                promotePendingProgress();
            } else {
                pendingProgressRef.current = [];
                setProgressSteps([]);
            }
        }

        appendProgressStep(event);

        switch (event.type) {
            case "direct_response_chunk":
                if (event.data?.chunk) {
                    setStreamingText(prev => {
                        const next = prev + event.data.chunk;
                        streamingTextRef.current = next;
                        return next;
                    });
                }
                break;
            case "direct_response_complete":
                if (event.data?.response) {
                    const next = event.data.response;
                    streamingTextRef.current = next;
                    setStreamingText(next);
                }
                break;
            case "complete":
                if (streamingTextRef.current) {
                    const finalMessage = streamingTextRef.current;
                    setMessages(prev => [...prev, { role: "agent", content: finalMessage }]);
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
                setRoute(null);
                routeRef.current = null;
                pendingProgressRef.current = [];
                closeStream();
                break;
            case "error":
                setIsChatPending(false);
                const lastStep = progressStepsRef.current[progressStepsRef.current.length - 1];
                const errorMessage = event.message || lastStep?.message || "Something went wrong.";
                setMessages(prev => [...prev, { role: "agent", content: errorMessage }]);
                setProgressSteps([]);
                setRoute(null);
                routeRef.current = null;
                pendingProgressRef.current = [];
                closeStream();
                break;
        }
    };

    const startStreaming = (prompt: string) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        const url = `${runnerUrl}/vibe/stream?user_prompt=${encodeURIComponent(prompt)}`;
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
            setRoute(null);
            routeRef.current = null;
            pendingProgressRef.current = [];
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
        setProgressSteps([]);
        setRoute(null);
        routeRef.current = null;
        pendingProgressRef.current = [];

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
        route,
        submitChatMessage,
        inputMessage,
        setInputMessage,
    };

    return (
        <AIChatContext.Provider value={contextValue}>
            {children}
        </AIChatContext.Provider>
    );
}

export function AIChat() {
    const { togglePanel } = useCodingStates();
    const { submitChatMessage } = useAIChat();

    return (
        <div className="bg-sidebar h-full flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-1 flex items-center justify-between">
                <h2 className="px-2">Chat</h2>

                <Button type="button" title={"Close Chat"} variant={"ghost"} size={'icon'} onClick={() => togglePanel(EPanel.AiChat, false)}>
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
    )
}