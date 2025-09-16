import { Injectable } from '@nestjs/common';
import { Agent, AgentInputItem, run, tool, Tool } from '@openai/agents';
import { FileSystemService } from 'src/file-system/file-system.service';
import { SocketEvents, WORKSPACE_PATH } from 'src/CONSTANTS';
import { ConfigService } from '@nestjs/config';
import { ChatMessageDto, EContextSelection } from './dto/chat-message.dto';
import z from 'zod';
import { FileSystemCRUDService } from 'src/file-system/file-system-crud.service';
import { exec } from 'node:child_process';
import { MinioService } from 'src/minio/minio.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: (origin, cb) => {
            if (origin === process.env.CLIENT_URL) {
                cb(null, true);
            } else {
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        methods: ['GET', 'POST'],
    },
})
export class AgentOrchestratorGateway {
    @WebSocketServer()
    server: Server;

    private replId: string;

    private history: AgentInputItem[] = [];
    private agent: Agent;

    constructor(
        private readonly fileSystem: FileSystemService,
        private readonly configService: ConfigService,
        private readonly fileSystemCRUDService: FileSystemCRUDService,
        private readonly minioService: MinioService
    ) {
        const replId: string = this.configService.getOrThrow<string>('REPL_ID');
        this.replId = replId;

        const tools = this.getTools();
        this.agent = new Agent({
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
            model: 'gpt-4o'
        });
    }

    async handleMessage(payload: ChatMessageDto) {
        const { message, selectedFilePath, contextSelection } = payload;

        this.history.push({ role: 'user', content: message });

        if (selectedFilePath) {
            const fullFilePath = `${WORKSPACE_PATH}${selectedFilePath}`;

            const fileContent = await this.fileSystem.fetchFileContent(fullFilePath);
            this.history.push({
                role: 'system',
                content: `CURRENT_FILE: ${selectedFilePath}\n\n${fileContent}`
            });
        }

        if (contextSelection === EContextSelection.REPO) {
            this.history.push({
                role: 'system',
                content: `CURRENT_FILE_SYSTEM: ${JSON.stringify([...this.minioService.getObjectList()])}`
            });
        }

        const result = await run(
            this.agent,
            this.history,
        );

        this.history = result.history;

        return result.finalOutput;
    }

    private getTools(): Tool<unknown>[] {
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

        const updateFileContentTool = tool({
            name: 'update_file_content',
            description: 'Update the content of a file in the project',
            parameters: z.object({
                path: z.string(),
                content: z.string(),
            }),
            execute: async ({ path, content }) => {
                await this.fileSystem.saveFile(`${WORKSPACE_PATH}${path}`, content);
                this.server.emit(SocketEvents.UPDATE_CONTENT, { path, content });
                return { ok: true };
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

        return [
            readFileTool,
            fetchDirTool,
            createItemTool,
            deleteItemTool,
            updateFileContentTool,
            runCommandTool,
        ];
    }
}
