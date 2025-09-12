import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EventEmitter } from 'events';
import { Agent, run, tool, Tool } from '@openai/agents';
import { MinioService } from 'src/minio/minio.service';
import { VectorService } from 'src/vector/vector.service';
import OpenAI from 'openai';
import { FileSystemService } from 'src/file-system/file-system.service';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { ConfigService } from '@nestjs/config';
import { LocalExecService } from 'src/local-exec/local-exec.service';
import { OpenAIService } from 'src/openai/openai.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import z from 'zod';

@Injectable()
export class AgentOrchestratorService {

    private replId: string;

    constructor(
        private readonly openai: OpenAIService,
        private readonly minio: MinioService,
        private readonly localExec: LocalExecService,
        private readonly vector: VectorService,
        private readonly fileSystem: FileSystemService,
        private readonly configService: ConfigService,
    ) {
        this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
    }

    async handleMessage(payload: ChatMessageDto) {
        const { message, selectedFilePath, contextSelection } = payload;

        const contextMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

        if (selectedFilePath) {
            const fullFilePath = `${WORKSPACE_PATH}${selectedFilePath}`;

            const fileContent = await this.fileSystem.fetchFileContent(fullFilePath);
            contextMessages.push({
                role: 'user',
                content: `CURRENT_FILE: ${selectedFilePath}\n\n${fileContent}`
            });
        }

        if (contextSelection === 'repo') {
            const hits = await this.vector.semanticSearch(this.replId, message, 5);
            for (const h of hits) {
                contextMessages.push({ role: 'system', content: `RETRIEVED_SNIPPET: ${h.path}\n${h.content}` });
            }
        }

        const tools = this.createToolset(this.replId);

        const agent = new Agent({
            name: 'vibecoder',
            instructions: 'You are VibeCoder — a secure assistant that can read, modify, and run code inside the user project. Always explain your actions and show diffs before writing.',
            tools
        });

        const result = await run(
            agent,
            payload.message
        );

        return result.finalOutput;
    }

    streamMessage(payload: any): Observable<any> {
        const ee = new EventEmitter();

        // simple example: emit progress messages later when agent streaming available
        setImmediate(() => ee.emit('message', { data: 'agent: starting' }));

        // NOTE: integrate agent streaming callback to emit SSE messages
        return new Observable((subscriber) => {
            const onMessage = (m) => subscriber.next({ data: m });
            ee.on('message', onMessage);
            return () => ee.off('message', onMessage);
        });
    }

    private createToolset(replId: string): Tool<unknown>[] {
        return [
            tool({
                name: 'read_file',
                description: 'Read file',
                parameters: z.object({ path: z.string() }),
                async execute({ path }) {
                    return await this.fileSystem.fetchFileContent(`${WORKSPACE_PATH}/${path}`);
                },
            }),
            tool({
                name: 'write_file',
                description: 'Write file to project (creates backup)',
                parameters: z.object({
                    path: z.string(),
                    content: z.string(),
                }),
                async execute({ path, content }) {
                    await this.fileSystem.saveFile(`${WORKSPACE_PATH}/${path}`, content);
                    await this.minio.saveToMinio(`code/${this.replId}`, path, content);
                    return { ok: true };
                },
            }),
            tool({
                name: 'list_files',
                description: 'List files at path',
                parameters: z.object({
                    path: z.string().default('/'),
                    depth: z.number().min(1).default(2),
                }),
                async execute({ path, depth }) {
                    return await this.minio.listFiles(this.replId, path, depth);
                },
            }),
            tool({
                name: 'run_command',
                description: 'Run command inside project workspace (host-level exec). Uses safe spawn/whitelist/timeouts.',
                parameters: z.object({
                    command: z.object({
                        cmd: z.string(),
                        args: z.array(z.string()).optional(),
                    }),
                    cwd: z.string().default('/'),
                    uid: z.number().optional(),
                }),
                async execute({ command, cwd, uid }) {
                    // IMPORTANT: command must be passed as { cmd: 'npm', args: ['test'] } form for safety.
                    // The agent orchestration layer must never pass raw shell strings unless you trust them.
                    try {
                        const result = await this.localExec.runCommand({
                            replId,
                            command,
                            cwd,
                            uid,
                        });
                        return result;
                    } catch (err) {
                        return { error: err instanceof Error ? err.message : String(err) };
                    }
                },
            }),
            tool({
                name: 'search_code',
                description: 'Semantic search codebase',
                parameters: z.object({
                    query: z.string(),
                    topK: z.number().min(1).default(5),
                }),
                async execute({ query, topK }) {
                    return await this.vector.semanticSearch(replId, query, topK);
                },
            }),
        ];
    }
}
