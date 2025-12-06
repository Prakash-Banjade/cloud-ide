"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useCodingStates } from "@/context/coding-states-provider";
import { SocketEvents } from "@/lib/CONSTANTS";
import { EPermission } from "@/types/types";
import { useParams } from "next/navigation";

const fitAddon = new FitAddon();
const decoder = new TextDecoder();

type XterminalProps = {
    socket: Socket,
}

export default function XTerminal({ socket }: XterminalProps) {
    const { permission, showPanel } = useCodingStates();
    const { replId } = useParams();

    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [term, setTerm] = useState<Terminal | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const terminal = new Terminal({
            cursorBlink: true,
            cols: 1000,
            theme: {
                background: theme === "dark" ? "#18181b" : "white",
                foreground: theme === "dark" ? "white" : "black",
                cursor: theme === "dark" ? "white" : "black",
            },
            disableStdin: permission === EPermission.READ
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

        socket.emit(SocketEvents.TERMINAL_REQUEST);

        const terminalRegex = new RegExp(`.*root@${replId}-[a-zA-Z0-9-]+:\/`, "ig");

        socket.on(SocketEvents.TERMINAL, ({ data }: { data: string | ArrayBuffer }) => {
            const text = typeof data === "string" ? data : decoder.decode(data);
            term.write(text.replaceAll(terminalRegex, ""));
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
            socket.off(SocketEvents.TERMINAL);
            ro.disconnect();
        };
    }, [term]);

    useEffect(() => {
        if (term) {
            term.options.theme = {
                background: theme === "dark" ? "#18181b" : "white",
                foreground: theme === "dark" ? "white" : "black",
                cursor: theme === "dark" ? "white" : "black",
            }
        }
    }, [theme, term]);

    // Focus the terminal when showTerm is true
    useEffect(() => {
        if (showPanel.terminal && term) {
            term.focus();
        }
    }, [showPanel.terminal])

    return (
        <div className={cn("h-full w-full p-2", theme === "dark" ? "bg-sidebar" : "bg-white")}>
            <div className="term-container h-full w-full" ref={terminalRef} />
        </div>
    );
};
