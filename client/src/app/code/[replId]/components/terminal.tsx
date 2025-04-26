"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const fitAddon = new FitAddon();
const decoder = new TextDecoder();

export const TerminalComponent = ({ socket }: { socket: Socket }) => {
    const terminalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!terminalRef.current || !socket) return;

        const term = new Terminal({
            cursorBlink: true,
            cols: 200,
            theme: { background: "black" },
        });
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        socket.emit("requestTerminal");
        socket.on("terminal", ({ data }: { data: string | ArrayBuffer }) => {
            const text = typeof data === "string" ? data : decoder.decode(data);
            term.write(text);
        });

        term.onData((input) => {
            socket.emit("terminalData", { data: input });
        });

        // Kickstart the shell
        socket.emit("terminalData", { data: "\n" });

        return () => {
            socket.off("terminal");
            term.dispose();
        };
    }, [socket]);

    return (
        <div className="h-full w-full" ref={terminalRef} />
    );
};
