import { Injectable } from '@nestjs/common';
import { Agent, AgentInputItem, run, tool, Tool } from '@openai/agents';
import { VectorService } from 'src/vector/vector.service';
import { FileSystemService } from 'src/file-system/file-system.service';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { ConfigService } from '@nestjs/config';
import { ChatMessageDto } from './dto/chat-message.dto';
import z from 'zod';
import { FileSystemCRUDService } from 'src/file-system/file-system-crud.service';
import { exec } from 'node:child_process';

@Injectable()
export class AgentOrchestratorService {

    private replId: string;

    private history: AgentInputItem[] = [];

    constructor(
        private readonly vector: VectorService,
        private readonly fileSystem: FileSystemService,
        private readonly configService: ConfigService,
        private readonly fileSystemCRUDService: FileSystemCRUDService,
    ) {
        this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
    }

    async handleMessage(payload: ChatMessageDto) {
        const { message, selectedFilePath, contextSelection } = payload;

        this.history.push({ role: 'user', content: message });

        if (selectedFilePath) {
            const fullFilePath = `${WORKSPACE_PATH}${selectedFilePath}`;

            const fileContent = await this.fileSystem.fetchFileContent(fullFilePath);
            this.history.push({
                role: 'user',
                content: `CURRENT_FILE: ${selectedFilePath}\n\n${fileContent}`
            });
        }

        if (contextSelection === 'repo') {
            const hits = await this.vector.semanticSearch(this.replId, message, 5);
            for (const h of hits) {
                this.history.push({ role: 'system', content: `RETRIEVED_SNIPPET: ${h.path}\n${h.content}` });
            }
        }

        const tools = this.createToolset(this.replId);

        const agent = new Agent({
            name: 'vibecoder',
            instructions: `
                You are Vibe coder — a secure assistant that can read, modify, and run code inside the user project. Always explain your actions and show diffs before writing.
                What ever application user wants to build or modify existing, you must help them achieve it by utilizing the provided tools.

                IMPORTANT CONSIDERATIONS:
                - While creating items (file or directory), ensure the path starts with a leading slash when passing the parameters, e.g. /src/index.js or /assets.
                - If user is asking to create React.js application, you must use 'npm create vite@latest [app-name] -- --template react' command to create the app.
                - When running commands, you must always use the 'run_command' tool. Never assume that you can run commands directly.
            `,
            tools,
            model: 'gpt-4.1'
        });

        const result = await run(
            agent,
            this.history,
        );

        this.history = result.history;

        return result.finalOutput;
    }

    private createToolset(replId: string): Tool<unknown>[] {
        const readFileTool = tool({
            name: 'read_file',
            description: 'Read file',
            parameters: z.object({ path: z.string() }),
            execute: async ({ path }) => {
                return await this.fileSystem.fetchFileContent(`${WORKSPACE_PATH}/${path}`);
            },
        });

        const fetchDirTool = tool({
            name: 'fetch_dir',
            description: 'Fetch directory listing',
            parameters: z.object({
                path: z.string().default(''),
            }),
            execute: async ({ path }) => {
                return await this.fileSystem.listFiles(`${WORKSPACE_PATH}/${path}`);
            },
        });

        const createItemTool = tool({
            name: 'create_item',
            description: 'Create a new file or directory in the project',
            parameters: z.object({
                path: z.string(),
                content: z.string().nullable(),
                type: z.enum(['file', 'dir']),
            }),
            execute: async ({ path, content, type }) => {
                console.log(`createItemTool: ${type} at ${path}`);
                const result = await this.fileSystemCRUDService.createItem({ path, type, content: content ?? '' });
                return { ok: result.success, error: result.error };
            },
        });

        const deleteItemTool = tool({
            name: 'delete_item',
            description: 'Delete a file or directory in the project',
            parameters: z.object({
                path: z.string(),
                type: z.enum(['file', 'dir']),
            }),
            execute: async ({ path, type }) => {
                const result = await this.fileSystemCRUDService.deleteItem({ path, type });
                return { ok: result };
            },
        });

        const runCommandTool = tool({
            name: 'run_command',
            description: 'Run command inside project workspace',
            parameters: z.object({
                command: z.string(),
            }),
            execute: async ({ command }) => {
                return new Promise((resolve, reject) => {
                    exec(command, function (error, stdout, stderr) {
                        if (error) {
                            reject(error);
                        }

                        resolve(`stdout: ${stdout}\n\nstderr: ${stderr}`);
                    })
                })
            },
        });

        const searchCodeTool = tool({
            name: 'search_code',
            description: 'Semantic search codebase',
            parameters: z.object({
                query: z.string(),
                topK: z.number().min(1).default(5),
            }),
            execute: async ({ query, topK }) => {
                return await this.vector.semanticSearch(replId, query, topK);
            },
        });

        return [
            readFileTool,
            fetchDirTool,
            createItemTool,
            deleteItemTool,
            runCommandTool,
            searchCodeTool,
        ];
    }
}
