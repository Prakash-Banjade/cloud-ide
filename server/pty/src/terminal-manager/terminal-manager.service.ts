import { Injectable } from '@nestjs/common';
import { IPty, spawn } from 'node-pty-prebuilt-multiarch';
import * as os from 'os';
import { Socket } from 'socket.io';
import { PROJECT_PATH } from 'src/CONSTANTS';

@Injectable()
export class TerminalManagerService {
    private sessions: { [id: string]: { terminal: IPty, socket: Socket } } = {};
    private SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    /** The PTY used for “run” commands */
    private runPty: IPty | null = null;
    /** Scrollback buffer for runPty output */
    private runScrollback = '';

    createPty(socket: Socket, onData: (data: string, id: number) => void) {
        const term = spawn(this.SHELL, [], {
            cols: 300,
            name: 'xterm',
            cwd: PROJECT_PATH,
            env: process.env as any,
        });

        term.onData((data: string) => {
            onData(data, term.pid)
        });

        this.sessions[socket.id] = { terminal: term, socket };

        term.onExit(() => {
            delete this.sessions[term.pid];
        });

        return term;
    }

    write(socketId: string, data: string) {
        this.sessions[socketId]?.terminal.write(data);
    }

    clear(socketId: string) {
        this.sessions[socketId]?.terminal.kill();
        delete this.sessions[socketId];
    }

    /**
     * Spawn (or restart) the “run” PTY. 
     * Accumulate its output into runScrollback,
     * and forward every chunk via onData().
     */
    run(cmd: string, onData: (data: string, id: number) => void) {
        // Kill existing run PTY if present
        this.runPty?.kill();

        // Reset scrollback
        this.runScrollback = '';

        // Spawn a fresh run PTY
        this.runPty = spawn(this.SHELL, [], {
            cols: 300,
            name: 'xterm',
            cwd: PROJECT_PATH,
            env: process.env as any,
        });

        const term = this.runPty;
        term.write(cmd + '\r');

        term.onData((data: string) => {
            // Append & cap scrollback (~100KB)
            this.runScrollback += data;
            if (this.runScrollback.length > 100_000) {
                this.runScrollback = this.runScrollback.slice(-100_000);
            }
            // Forward to caller
            onData(data, term.pid);
        });

        // On exit, clear PTY and scrollback
        term.onExit(() => {
            this.runPty = null;
            this.runScrollback = '';
        });
    }

    stopProcess() {
        this.runPty?.kill();
    }

    isRunning() {
        return this.runPty !== null;
    }

    /** Retrieve the current scrollback for the run PTY */
    getRunScrollback(): string {
        return this.runScrollback;
    }
}
