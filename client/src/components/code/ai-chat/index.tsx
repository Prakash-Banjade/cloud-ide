"use client";

import React, { useState, createContext, useContext, useEffect, useRef } from "react";
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
    timestamp: string;
}

interface AIChatContextType {
    messages: IChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IChatMessage[]>>;
    isChatPending: boolean;
    streamingText: string;
    setStreamingText: React.Dispatch<React.SetStateAction<string>>;
    isStreaming: boolean;
    statusMessage: string | null;
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
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const statusMessageRef = useRef<string | null>(null);
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
        statusMessageRef.current = statusMessage;
    }, [statusMessage]);

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

    const getStatusFromEvent = (event: StreamEvent): string | null => {
        const agentLabels: Record<string, string> = {
            router: "Router",
            direct: "Direct response",
            planner: "Planner",
            architect: "Architect",
            coder: "Coder",
        };

        switch (event.type) {
            case "agent_start":
                if (event.agent === "router") return "Deciding the best approach for your request.";
                if (event.agent === "direct") return "Drafting a direct answer.";
                if (event.agent === "planner") return "Outlining a plan of action.";
                if (event.agent === "architect") return "Breaking the work into tasks.";
                if (event.agent === "coder") return "Implementing the changes.";
                return agentLabels[event.agent ?? ""] ? `${agentLabels[event.agent ?? ""]} is working...` : "Thinking...";
            case "router_decision":
                if (event.data?.route === "direct") {
                    return "Responding directly to your question.";
                }
                return "Setting up a multi-step plan.";
            case "planner_plan_created":
                return "Plan created. Handing off to implementation.";
            case "architect_task_created":
                return "Tasks prepared. Getting ready to code.";
            case "coder_task_complete":
                if (event.data?.totalSteps && event.data?.currentStep) {
                    return `Completed step ${event.data.currentStep} of ${event.data.totalSteps}.`;
                }
                return "Making progress on the implementation.";
            case "coder_all_complete":
                return "All tasks finished. Wrapping up.";
            case "direct_response_complete":
                return "Writing the response.";
            case "complete":
                return "Finalizing the answer.";
            case "error":
                return event.data?.error ? `Error: ${event.data.error}` : "Something went wrong.";
            default:
                return null;
        }
    };

    const handleStreamEvent = (event: StreamEvent) => {
        const status = getStatusFromEvent(event);
        if (status) {
            setStatusMessage(status);
        }

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
                    const fallback = statusMessageRef.current;
                    const completionMessage = fallback && fallback !== "Finalizing the answer."
                        ? fallback
                        : "Agent run complete.";
                    setMessages(prev => [...prev, { role: "agent", content: completionMessage }]);
                }
                setIsChatPending(false);
                setStatusMessage(null);
                closeStream();
                break;
            case "error":
                setIsChatPending(false);
                const errorMessage = statusMessageRef.current || "Something went wrong.";
                setMessages(prev => [...prev, { role: "agent", content: errorMessage }]);
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
            setStatusMessage("Connection lost. Please try again.");
            setIsChatPending(false);
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
        setStatusMessage("Connecting to the agent...");

        startStreaming(trimmedMessage);
    }

    const contextValue = {
        messages,
        setMessages,
        isChatPending,
        streamingText,
        setStreamingText,
        isStreaming,
        statusMessage,
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

