import { Injectable } from '@nestjs/common';
import { IPty, spawn } from 'node-pty-prebuilt-multiarch';
import * as os from 'os';
import { Socket } from 'socket.io';
import { PROJECT_PATH } from 'src/CONSTANTS';

@Injectable()
export class TerminalManagerService {
    private sessions: { [id: string]: { terminal: IPty, socket: Socket } } = {};
    private SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

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
}
