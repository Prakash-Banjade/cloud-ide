import { Injectable } from '@nestjs/common';
import { IPty, spawn } from 'node-pty-prebuilt-multiarch';
import * as os from 'os';
import { PROJECT_PATH } from 'src/CONSTANTS';

@Injectable()
export class TerminalManagerService {

    private sessions: { [id: string]: { terminal: IPty, replId: string; } } = {};
    private SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    createPty(socketId: string, replId: string, onData: (data: string, id: number) => void) {
        let term = spawn(this.SHELL, [], {
            cols: 300,
            name: 'xterm',
            cwd: PROJECT_PATH,
        });

        term.onData((data: string) => onData(data, term.pid));

        this.sessions[socketId] = {
            terminal: term,
            replId
        };

        term.onExit(() => {
            delete this.sessions[term.pid];
        });

        return term;
    }

    write(socketId: string, data: string) {
        this.sessions[socketId]?.terminal.write(data);
    }

    clear(terminalId: string) {
        this.sessions[terminalId]?.terminal.kill();
        delete this.sessions[terminalId];
    }

}
