import { useAIChat } from "."
import { cn } from "@/lib/utils";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight'; // For syntax highlighting
import 'highlight.js/styles/github.css'; // Or any other theme you prefer
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css"; // import a highlight.js CSS theme
import { LoaderCircle, Sparkles } from "lucide-react";

export default function ChatContent() {
    const { messages, isChatPending } = useAIChat();

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
        <section className="p-3 px-4 pb-40">
            {
                messages.map((message, ind) => {
                    return (
                        <div
                            key={ind}
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
                                    }}
                                >
                                    {message.content}
                                </Markdown>
                            </div>
                        </div>
                    )
                })
            }

            {
                isChatPending && (
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <LoaderCircle size={16} className="animate-spin" />
                        <span>Working...</span>
                    </div>
                )
            }

        </section>
    )
}