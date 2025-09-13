import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send, Settings, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useCodingStates } from "@/context/coding-states-provider";
import { cn } from "@/lib/utils";

export default function ChatInput() {
    const [agent, setAgent] = useState("Agent")
    const [model, setModel] = useState("GPT-4.1")
    const [inputMessage, setInputMessage] = useState("")
    const { selectedFile } = useCodingStates();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
    }

    return (
        <form
            className={cn(
                `w-full bg-sidebar-accent rounded-lg border p-4 transition-colors`,
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
                    <span className="text-sm">Add Context...</span>
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
            <input
                type="text"
                placeholder="Add context (#), extensions (@), commands (/)"
                className="w-full bg-transparent text-sm mb-4 outline-none border-none focus:ring-0"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
            />

            {/* Bottom controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Agent selector */}
                    <Select value={agent} onValueChange={setAgent}>
                        <SelectTrigger className="border-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Agent">
                                Agent
                            </SelectItem>
                            <SelectItem value="Assistant">
                                Assistant
                            </SelectItem>
                            <SelectItem value="Helper">
                                Helper
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Model selector */}
                    <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="border-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GPT-4.1">
                                GPT-4.1
                            </SelectItem>
                            <SelectItem value="GPT-4">
                                GPT-4
                            </SelectItem>
                            <SelectItem value="GPT-3.5">
                                GPT-3.5
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Right side controls */}
                <div>
                    <Button variant="ghost" size={'icon'}>
                        <Settings className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size={'icon'}>
                        <Mic className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size={'icon'}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </form>
    )
}