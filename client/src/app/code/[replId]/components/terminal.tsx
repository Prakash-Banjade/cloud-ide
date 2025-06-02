"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useCodingStates } from "@/context/coding-states-provider";
import { EItemType } from "./file-tree";

const fitAddon = new FitAddon();
const decoder = new TextDecoder();

export default function TerminalComponent({ socket }: { socket: Socket }) {
    const { fileStructure } = useCodingStates();

    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [term, setTerm] = useState<Terminal | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            cols: 200,
            theme: {
                background: theme === "dark" ? "black" : "white",
                foreground: theme === "dark" ? "white" : "black",
                cursor: theme === "dark" ? "white" : "black",
            },
        });

        setTerm(terminal);

        return () => {
            if (terminal) {
                terminal.dispose();
            }
        };
    }, [theme]);

    useEffect(() => {
        if (!term || !socket || !terminalRef.current) return;

        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        setTerm(term);

        socket.emit("requestTerminal");
        socket.on("terminal", ({ data }: { data: string | ArrayBuffer }) => {
            const text = typeof data === "string" ? data : decoder.decode(data);
            term.write(text);
        });

        term.onData((input) => {
            socket.emit("terminalData", { data: input });
        });

        // execute the dependency install command, if there is one
        const hasDependeiciesNotInstalled = fileStructure.find(item => item.type === EItemType.FILE && item.name === "package.json") && !fileStructure.find(item => item.type === EItemType.DIR && item.name === "node_modules");

        if (hasDependeiciesNotInstalled) {
            socket.emit("terminalData", { data: "npm install\n" });
        }

        return () => {
            if (term) term.dispose();
            socket.off("terminal");
        };
    }, [term]);



    return (
        <div className={cn("h-full w-full p-2", theme === "dark" ? "bg-black" : "bg-white")}>
            <div className="h-full w-full" ref={terminalRef} />
        </div>
    );
};
