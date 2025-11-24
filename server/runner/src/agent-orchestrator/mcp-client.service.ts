import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { WORKSPACE_PATH } from 'src/CONSTANTS';

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

        this.initializationPromise = this.initializeClient();
        this.client = await this.initializationPromise;
        return this.client;
    }

    private async initializeClient(): Promise<McpClient> {
        const sdk = await import('@modelcontextprotocol/sdk');
        const { Client, StdioClientTransport } = sdk as any;

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

        if (typeof transport.connect === 'function') {
            await transport.connect();
        } else if (typeof transport.start === 'function') {
            await transport.start();
        }

        if (typeof client.connect === 'function') {
            await client.connect();
        } else if (typeof client.initialize === 'function') {
            await client.initialize();
        }

        return client;
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
