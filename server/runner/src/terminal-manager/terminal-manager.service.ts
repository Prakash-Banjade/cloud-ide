import { Injectable } from '@nestjs/common';
import { IPty, spawn } from 'node-pty-prebuilt-multiarch';
import * as os from 'os';

@Injectable()
export class TerminalManagerService {
    private sessions: { [id: string]: { terminal: IPty, replId: string; } } = {};
    private SHELL = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        let term = spawn(this.SHELL, [], {
            cols: 200,
            name: 'xterm',
            cwd: `/workspace`
        });

        term.onData((data: string) => onData(data, term.pid));
        this.sessions[id] = {
            terminal: term,
            replId
        };
        term.onExit(() => {
            delete this.sessions[term.pid];
        });
        return term;
    }

    write(terminalId: string, data: string) {
        this.sessions[terminalId]?.terminal.write(data);
    }

    clear(terminalId: string) {
        this.sessions[terminalId]?.terminal.kill();
        delete this.sessions[terminalId];
    }

}
