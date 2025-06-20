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
import { SocketEvents } from "@/lib/CONSTANTS";

const fitAddon = new FitAddon();
const decoder = new TextDecoder();

type XterminalProps = {
    socket: Socket,
    showTerm: boolean
}

export default function XTerminal({ socket, showTerm }: XterminalProps) {
    const { fileStructure } = useCodingStates();

    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [term, setTerm] = useState<Terminal | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            cols: 1000,
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
    }, [socket]);

    useEffect(() => {
        if (!term || !socket || !terminalRef.current) return;

        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        setTerm(term);

        socket.emit(SocketEvents.REQUEST_TERMINAL);
        socket.on(SocketEvents.TERMINAL, ({ data }: { data: string | ArrayBuffer }) => {
            const text = typeof data === "string" ? data : decoder.decode(data);
            term.write(text);
        });

        term.onData((input) => {
            socket.emit(SocketEvents.TERMINAL_DATA, { data: input });
        });

        // --- observe container resizes and re-fit ---
        const ro = new ResizeObserver(() => {
            fitAddon.fit();
        });
        ro.observe(terminalRef.current);

        return () => {
            if (term) term.dispose();
            socket.off("terminal");
            ro.disconnect();
        };
    }, [term]);

    useEffect(() => {
        if (term) {
            term.options.theme = {
                background: theme === "dark" ? "black" : "white",
                foreground: theme === "dark" ? "white" : "black",
                cursor: theme === "dark" ? "white" : "black",
            }
        }
    }, [theme, term]);

    // Focus the terminal when showTerm is true
    useEffect(() => {
        if (showTerm && term) {
            term.focus();
        }
    }, [showTerm])

    return (
        <div className={cn("h-full w-full p-2", theme === "dark" ? "bg-black" : "bg-white")}>
            <div className="term-container h-full w-full" ref={terminalRef} />
        </div>
    );
};
