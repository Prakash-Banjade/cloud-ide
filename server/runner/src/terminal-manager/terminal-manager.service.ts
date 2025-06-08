import { Injectable } from '@nestjs/common';
import { IPty, spawn } from 'node-pty-prebuilt-multiarch';
import * as os from 'os';
import { Socket } from 'socket.io';
import { PROJECT_PATH } from 'src/CONSTANTS';
import * as net from 'net';

@Injectable()
export class TerminalManagerService {
    private sessions: { [id: string]: { terminal: IPty, socket: Socket } } = {};
    private SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    private runPty: IPty | null = null;

    createPty(socket: Socket, replId: string, onData: (data: string, id: number) => void) {
        let term = spawn(this.SHELL, [], {
            cols: 300,
            name: 'xterm',
            cwd: PROJECT_PATH,
            env: process.env as any
        });

        term.onData((data: string) => onData(data, term.pid));

        this.sessions[socket.id] = {
            terminal: term,
            socket
        };

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

    run(cmd: string, onData: (data: string, id: number) => void) {
        this.runPty?.kill();

        this.runPty = spawn(this.SHELL, [], {
            cols: 300,
            name: 'xterm',
            cwd: PROJECT_PATH,
            env: process.env as any
        });

        const term = this.runPty;

        if (term) {
            term.write(cmd + '\r');

            term.onData((data: string) => onData(data, term.pid));

            term.onExit(() => {
                this.runPty = null;
            });
        }
    }

    stopProcess() {
        this.runPty?.kill();
    }

    checkPort(port: number) {
        console.log('Checking runPty')
        return this.runPty !== null;
        
        return new Promise((resolve) => {
            const socket = new net.Socket();

            socket.setTimeout(1000);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.connect(port, '127.0.0.1');
        });
    }
}
