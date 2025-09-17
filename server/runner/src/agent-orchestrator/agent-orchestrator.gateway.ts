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
import { StreamingService } from 'src/streaming/streaming.service';

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
        private readonly minioService: MinioService,
        private readonly streamingService: StreamingService,
    ) {
        const replId: string = this.configService.getOrThrow<string>('REPL_ID');
        this.replId = replId;

        const tools = this.getTools();
        this.agent = new Agent({
            name: 'vibecoder',
            instructions: `
                You are Vibe coder — a secure assistant that can read, modify, and run code inside the user project. 
                Explain what you are doing and why.
                If the user is talking about building an application or feature, you outilne what to build and ask user permission to create files. Once the user agreed, you use the provided tools and start executing the tools achieving the user's goal. 
                If the tech stack is not explicit, use HTML, CSS and JS if applicable.

                ---

                Before updating the file content, check if the file exists, if not, create it using the 'create_item' tool.
            `,
            tools,
            model: 'gpt-4.1'
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

        console.log(this.minioService.getObjectList())
        
        if (contextSelection === EContextSelection.REPO) {
            this.history.push({
                role: 'system',
                content: `CURRENT_FILE_SYSTEM: ${JSON.stringify([...this.minioService.getObjectList()])}`
            });
        }

        const result = await run(
            this.agent,
            this.history,
            { stream: true }
        );

        result
            .toTextStream({
                compatibleWithNodeStreams: true,
            })
            .on("data", (chunk) => this.streamingService.emitData(chunk.toString()))
            .on("end", () => this.streamingService.emitData("Stream ended"))

        // wait for the stream to complete
        await result.completed;

        this.history = result.history;
    }

    private getTools(): Tool<unknown>[] {
        const readFileTool = tool({
            name: 'read_file',
            description: 'Read file',
            parameters: z.object({ path: z.string().describe('Path to the file with leading slash') }),
            execute: async ({ path }) => {
                console.log(`readFileTool: ${path}`);
                return await this.fileSystem.fetchFileContent(`${WORKSPACE_PATH}${path}`);
            },
        });

        const fetchDirTool = tool({
            name: 'fetch_dir',
            description: 'Fetch directory listing',
            parameters: z.object({
                path: z.string().default('').describe('Path to the directory with leading slash'),
            }),
            execute: async ({ path }) => {
                console.log(`fetchDirTool: ${path}`);
                return await this.fileSystem.listFiles(`${WORKSPACE_PATH}${path}`);
            },
        });

        const createItemTool = tool({
            name: 'create_item',
            description: 'Create a new file or directory in the project',
            parameters: z.object({
                path: z.string().describe('Path to the file or directory with leading slash'),
                content: z.string().nullable().describe('Content of the file'),
                type: z.enum(['file', 'dir']).describe('Type of the item'),
            }),
            execute: async ({ path, content, type }) => {
                console.log(`createItemTool: ${type} at ${path}`);
                const result = await this.fileSystemCRUDService.createItem({ path, type, content: content ?? '' });
                if (result.success) {
                    // emit to active users
                    this.server.emit(SocketEvents.ITEM_CREATED, { path, type, content });
                }
                return { ok: result.success, error: result.error };
            },
        });

        const updateFileContentTool = tool({
            name: 'update_file_content',
            description: 'Update the content of a file in the project',
            parameters: z.object({
                path: z.string().describe('Path to the file with leading slash'),
                content: z.string().describe('Content of the file'),
            }),
            execute: async ({ path, content }) => {
                console.log(`updateFileContentTool: ${path}`);
                await this.fileSystem.saveFile(`${WORKSPACE_PATH}${path}`, content);
                this.server.emit(SocketEvents.UPDATE_CONTENT, { path, content });
                return { ok: true };
            },
        });

        const deleteItemTool = tool({
            name: 'delete_item',
            description: 'Delete a file or directory in the project',
            parameters: z.object({
                path: z.string().describe('Path to the file or directory with leading slash'),
                type: z.enum(['file', 'dir']).describe('Type of the item'),
            }),
            execute: async ({ path, type }) => {
                console.log(`deleteItemTool: ${type} at ${path}`);
                const result = await this.fileSystemCRUDService.deleteItem({ path, type });
                return { ok: result };
            },
        });

        const runCommandTool = tool({
            name: 'run_command',
            description: 'Run command inside project workspace',
            parameters: z.object({
                command: z.string().describe('Command to run'),
            }),
            execute: async ({ command }) => {
                console.log("Running command:", command);
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
