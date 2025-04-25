"use client"

import { useEffect, useRef } from "react"
import { Socket } from "socket.io-client";
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from "@xterm/xterm";

const fitAddon = new FitAddon();

function bufToString(buf: string | ArrayBuffer): string {
    if (typeof buf === "string") {
        return buf;
    }
    // TextDecoder.decode accepts ArrayBuffer or TypedArray
    return new TextDecoder().decode(buf);
}

const OPTIONS_TERM = {
    useStyle: true,
    screenKeys: true,
    cursorBlink: true,
    cols: 200,
    theme: {
        background: "black"
    }
};
export const TerminalComponent = ({ socket }: { socket: Socket }) => {
    const terminalRef = useRef(null);

    useEffect(() => {
        if (!terminalRef || !terminalRef.current || !socket) {
            return;
        }

        socket.emit("requestTerminal");
        socket.on("terminal", terminalHandler)
        
        const term = new Terminal(OPTIONS_TERM)
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        function terminalHandler({ data }: { data: string | ArrayBuffer }) {
            if (data instanceof ArrayBuffer) {
                term.write(bufToString(data))
            }
        }
        
        term.onData((data) => {
            socket.emit('terminalData', {
                data
            });
        });

        socket.emit('terminalData', {
            data: '\n'
        });

        return () => {
            socket.off("terminal")
        }
    }, [terminalRef]);

    return <div style={{ width: "40vw", height: "400px", textAlign: "left" }} ref={terminalRef}></div>
}