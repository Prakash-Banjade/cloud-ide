import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

type McpClient = any;
type McpTransport = any;

@Injectable()
export class McpClientService implements OnModuleDestroy {
    private client?: McpClient;
    private transport?: McpTransport;
    private initializationPromise?: Promise<McpClient>;

    async onModuleDestroy() {
        await this.teardown();
    }

    async listResources(): Promise<any[]> {
        const client = await this.ensureClient();
        const response = await client.listResources();
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.resources)) return response.resources;
        return [];
    }

    async readResource(uri: string): Promise<string> {
        const client = await this.ensureClient();
        const result = await client.readResource({ uri });

        if (typeof result === 'string') return result;
        if (typeof result?.contents === 'string') return result.contents;
        if (Array.isArray(result?.contents)) {
            return result.contents.join('');
        }

        return '';
    }

    async callTool(name: string, input: Record<string, any> = {}): Promise<any> {
        const client = await this.ensureClient();
        const result = await client.callTool({ name, arguments: input });
        return result?.content ?? result;
    }

    private async ensureClient(): Promise<McpClient> {
        if (this.client) return this.client;
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = this.initializeClient().catch((error) => {
            this.initializationPromise = undefined;
            throw error;
        });
        this.client = await this.initializationPromise;
        return this.client;
    }

    private async initializeClient(): Promise<McpClient> {
        try {
            // @ts-ignore
            const { Client } = await import('@modelcontextprotocol/sdk/client');
            const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio');

            const transport = new StdioClientTransport({
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-filesystem', '--root', WORKSPACE_PATH, '--stdio'],
            });

            const client = new Client(
                {
                    name: 'cloud-ide-runner',
                    version: '1.0.0',
                },
                { transport }
            );

            this.transport = transport;

            const transportLifecycle = transport as { connect?: () => Promise<void>; start?: () => Promise<void> };
            if (typeof transportLifecycle.connect === 'function') {
                await transportLifecycle.connect();
            } else if (typeof transportLifecycle.start === 'function') {
                await transportLifecycle.start();
            }

            if (typeof client.connect === 'function') {
                await client.connect();
            } else if (typeof client.initialize === 'function') {
                await client.initialize();
            }

            return client;
        } catch (error) {
            console.warn('Falling back to filesystem MCP shim', error);
            return this.createFilesystemClient();
        }
    }

    private createFilesystemClient(): McpClient {
        const resolvePath = (uriOrPath: string): string => {
            if (!uriOrPath) return WORKSPACE_PATH;
            try {
                if (uriOrPath.startsWith('file://')) {
                    return fileURLToPath(uriOrPath);
                }
            } catch { }
            return path.isAbsolute(uriOrPath) ? uriOrPath : path.join(WORKSPACE_PATH, uriOrPath);
        };

        const walk = async (dir: string, maxDepth: number, depth = 0, acc: string[] = []): Promise<string[]> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.name.startsWith('.git')) continue;
                const fullPath = path.join(dir, entry.name);
                acc.push(`file://${fullPath}`);
                if (entry.isDirectory() && depth < maxDepth) {
                    await walk(fullPath, maxDepth, depth + 1, acc);
                }
            }
            return acc;
        };

        return {
            listResources: async () => {
                try {
                    return await walk(WORKSPACE_PATH, 3);
                } catch (err) {
                    console.warn('Filesystem MCP shim: listResources failed', err);
                    return [];
                }
            },
            readResource: async ({ uri }: { uri: string }) => {
                const target = resolvePath(uri);
                try {
                    return await fs.readFile(target, 'utf-8');
                } catch (err) {
                    console.warn('Filesystem MCP shim: readResource failed', err);
                    return '';
                }
            },
            callTool: async ({ name, arguments: args = {} }: { name: string; arguments?: Record<string, any> }) => {
                const targetPath = resolvePath(args.path || args.uri || args.target || '');
                try {
                    if (name === 'write_file') {
                        await fs.mkdir(path.dirname(targetPath), { recursive: true });
                        await fs.writeFile(targetPath, args.content ?? args.text ?? '', 'utf-8');
                        return { content: 'ok' };
                    }
                    if (name === 'make_directory') {
                        await fs.mkdir(targetPath, { recursive: true });
                        return { content: 'ok' };
                    }
                    throw new Error(`Unsupported tool in filesystem shim: ${name}`);
                } catch (err: any) {
                    return { error: err?.message ?? String(err) };
                }
            },
            close: async () => { },
        } as McpClient;
    }

    private async teardown() {
        try {
            if (this.client && typeof this.client.close === 'function') {
                await this.client.close();
            }
            if (this.transport && typeof this.transport.close === 'function') {
                await this.transport.close();
            }
        } catch (error) {
            console.warn('Failed to tear down MCP client', error);
        }
    }
}
