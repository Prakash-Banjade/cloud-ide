import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalExecService {
    private readonly logger = new Logger(LocalExecService.name);
    private readonly whitelist: Set<string>;
    private readonly timeoutMs: number;
    private readonly stdoutLimit: number;
    private readonly stderrLimit: number;

    constructor(
        private readonly configService: ConfigService,
    ) {
        const raw = this.configService.get<string>('SAFE_EXEC_WHITELIST') || '';
        this.whitelist = new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
        this.timeoutMs = +(this.configService.get<number>('EXEC_TIMEOUT_MS') || 30000);
        this.stdoutLimit = +(this.configService.get<number>('EXEC_STDOUT_LIMIT') || 1000000);
        this.stderrLimit = +(this.configService.get<number>('EXEC_STDERR_LIMIT') || 1000000);

        this.logger.log(`LocalExecService initialized. whitelist=${[...this.whitelist].join(',')}`);
    }

    /**
     * Run a command in a safe manner.
     *
     * command: either a simple command string (only allowed if it exactly matches whitelist), or
     *          { cmd: 'npm', args: ['test'] } style where cmd must be whitelisted and args are arrays.
     *
     * returns: { stdout, stderr, code, signal, timedOut }
     */
    async runCommand(opts: {
        replId?: string; // optional metadata for logging/audit
        command: string | { cmd: string; args?: string[] };
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        uid?: number; // optional non-root UID to run as
    }): Promise<{ stdout: string; stderr: string; code: number | null; signal: string | null; timedOut: boolean }> {
        const { command, cwd = '/', env = process.env, uid } = opts;

        // prepare command + args safely
        let cmd: string;
        let args: string[] = [];

        if (typeof command === 'string') {
            // If caller passed a raw string, only allow it if it's exactly one whitelisted command (no args)
            const parts = command.trim().split(/\s+/).filter(Boolean);
            if (parts.length === 0) throw new Error('empty command');
            cmd = parts[0];
            if (parts.length > 1) {
                // don't allow raw string with spaces (avoid shell interpolation). Reject:
                throw new Error('raw command string with arguments is not allowed; use {cmd,args} form');
            }
            args = [];
        } else {
            cmd = command.cmd;
            args = (command.args || []).slice();
        }

        if (!this.isWhitelisted(cmd)) {
            throw new Error(`command not permitted: ${cmd}`);
        }

        // spawn (no shell) to avoid shell injection
        this.logger.log(`Spawning command: ${cmd} ${args.join(' ')} cwd=${cwd} project=${opts.replId}`);

        return new Promise((resolve, reject) => {
            let timedOut = false;
            let stdoutSize = 0;
            let stderrSize = 0;
            let stdoutBuf = '';
            let stderrBuf = '';

            // options: try to drop privileges if uid provided (container must permit this)
            const spawnOpts: any = {
                cwd,
                env,
                stdio: ['ignore', 'pipe', 'pipe'] as any,
            };
            if (typeof uid === 'number') {
                try {
                    // only set uid if available on platform
                    if (process.getuid && process.getuid() === 0) {
                        spawnOpts.uid = uid;
                    }
                } catch (e) {
                    // ignore
                }
            }

            let child: ChildProcessWithoutNullStreams;
            try {
                child = spawn(cmd, args, spawnOpts);
            } catch (err) {
                return reject(err);
            }

            const killTimer = setTimeout(() => {
                timedOut = true;
                // try gentle SIGTERM, then SIGKILL
                try {
                    child.kill('SIGTERM');
                } catch (e) {
                    // ignore
                }
                // hard kill after short grace
                setTimeout(() => {
                    try {
                        child.kill('SIGKILL');
                    } catch (e) { }
                }, 2000);
            }, this.timeoutMs);

            const cleanup = () => {
                clearTimeout(killTimer);
                // detach listeners to help GC
                if (child.stdout) child.stdout.removeAllListeners();
                if (child.stderr) child.stderr.removeAllListeners();
                child.removeAllListeners();
            };

            child.stdout.on('data', (chunk: Buffer) => {
                stdoutSize += chunk.length;
                if (stdoutSize <= this.stdoutLimit) stdoutBuf += chunk.toString();
                // if over limit, kill process to avoid runaway
                if (stdoutSize > this.stdoutLimit) {
                    this.logger.warn(`stdout limit exceeded (${stdoutSize} > ${this.stdoutLimit}), killing process`);
                    try { child.kill('SIGKILL'); } catch (e) { }
                }
            });

            child.stderr.on('data', (chunk: Buffer) => {
                stderrSize += chunk.length;
                if (stderrSize <= this.stderrLimit) stderrBuf += chunk.toString();
                if (stderrSize > this.stderrLimit) {
                    this.logger.warn(`stderr limit exceeded (${stderrSize} > ${this.stderrLimit}), killing process`);
                    try { child.kill('SIGKILL'); } catch (e) { }
                }
            });

            child.on('error', (err) => {
                cleanup();
                this.logger.error('child process error', err);
                reject(err);
            });

            child.on('close', (code, signal) => {
                cleanup();
                resolve({ stdout: stdoutBuf, stderr: stderrBuf, code, signal, timedOut });
            });
        });
    }

    private isWhitelisted(cmd: string) {
        // exact match to whitelist; optionally allow absolute paths to whitelisted binaries
        if (this.whitelist.has(cmd)) return true;
        // allow absolute path commands but only if basename is whitelisted
        try {
            const base = require('path').basename(cmd);
            return this.whitelist.has(base);
        } catch (e) {
            return false;
        }
    }
}
