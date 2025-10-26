import { IChatMessage, StreamProgressStep, useAIChat } from "."
import { cn } from "@/lib/utils";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight'; // For syntax highlighting
import 'highlight.js/styles/github.css'; // Or any other theme you prefer
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css"; // import a highlight.js CSS theme
import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ChatContent() {
    const { messages, isChatPending, streamingText, progressSteps, route } = useAIChat();

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, streamingText, isChatPending, progressSteps]);

    if (messages.length === 0) return (
        <div className="@container flex-1 grid place-items-center">
            <div className="flex items-center justify-center flex-col">
                <Sparkles className="text-muted-foreground" size={64} />
                <h3 className="font-bold text-center @md:text-3xl text-2xl mt-4 mb-2">Build with agent mode</h3>
                <p className="text-center text-sm text-muted-foreground">AI responses may be inaccurate</p>
            </div>
        </div>
    );

    return (
        <section className="p-3 px-4 pb-20">
            {
                messages.map((message, ind) => {
                    return <RenderChatMessage key={ind} message={message} />;
                })
            }

            {isChatPending && route !== "agent" && streamingText.length === 0 && (
                <AgentThinking />
            )}

            {isChatPending && route === "agent" && (
                <AgentProgress steps={progressSteps} />
            )}

            {
                streamingText.length > 0 && (
                    <RenderChatMessage message={{ role: "agent", content: streamingText }} />
                )
            }

            <div ref={ref} className="h-10" />

        </section>
    )
}

function RenderChatMessage({ message }: { message: IChatMessage }) {
    return (
        <div
            className={cn(
                `flex mb-5`,
                message.role === "user" ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "text-sm py-2 w-fit max-w-[600px]",
                    message.role === "user" && "px-3 bg-brand/20 rounded-md"
                )}
            >
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                        rehypeHighlight,
                        rehypeRaw,
                    ]}
                    components={{
                        pre({ node, ...props }) {
                            return <pre style={{ margin: '10px 0' }} {...props} />;
                        },
                        code({ node, ...props }) {
                            return <code style={{ borderRadius: '8px', border: "1px solid var(--border)" }} {...props} />;
                        },
                        ol({ node, ...props }) {
                            return <ol className="[&_li]:list-decimal [&_li]:list-inside" {...props} />;
                        },
                        ul({ node, ...props }) {
                            return <ul className="[&_li]:list-disc [&_li]:list-inside" {...props} />;
                        }
                    }}
                >
                    {message.content}
                </Markdown>
            </div>
        </div>
    )
}

function AgentThinking() {
    return (
        <div className="mb-4 flex items-center gap-2">
            <LoaderCircle size={18} className="animate-spin text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Thinking...</p>
        </div>
    );
}

function AgentProgress({ steps }: { steps: StreamProgressStep[] }) {
    if (steps.length === 0) {
        return (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-sidebar-accent/60 p-3 text-sm">
                <LoaderCircle size={18} className="mt-0.5 animate-spin text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent working...</p>
                    <p className="font-medium text-foreground">Waiting for agent updates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-lg border border-border bg-sidebar-accent/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <LoaderCircle size={16} className="animate-spin" />
                Vibe Agent Progress
            </div>
            <ol className="relative mt-3 space-y-3 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-border/80">
                {steps.map((step, index) => {
                    const isActive = index === steps.length - 1;
                    return (
                        <li key={step.id} className="relative pl-8 text-sm leading-5 text-foreground">
                            <span className="absolute left-[3px] top-1 flex h-3 w-3 items-center justify-center">
                                <span
                                    className={cn(
                                        "h-3 w-3 rounded-full border border-border bg-background",
                                        isActive && "border-brand/70 bg-brand/60"
                                    )}
                                />
                            </span>
                            {step.agent && (
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    {step.agent}
                                </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm text-foreground">
                                {step.message}
                            </p>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
