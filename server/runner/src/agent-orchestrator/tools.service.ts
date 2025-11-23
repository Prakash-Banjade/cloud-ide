import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { tool } from '@langchain/core/tools';
import z from 'zod/v3';
import { ELanguage } from './types/language.types';
import { MinioService } from 'src/minio/minio.service';
import { McpClientService } from './mcp-client.service';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { RepoMapService } from './repo-map.service';

@Injectable()
export class ToolsService {
    constructor(
        private readonly minioService: MinioService,
        private readonly mcpClient: McpClientService,
        private readonly repoMapService: RepoMapService,
    ) { }

    private normalizeUri(pathOrUri: string): string {
        if (pathOrUri.startsWith('file://')) {
            return pathOrUri;
        }

        const normalized = pathOrUri.startsWith('/')
            ? pathOrUri
            : `/${pathOrUri}`;

        return `file://${WORKSPACE_PATH}${normalized}`;
    }

    private async formatResources(): Promise<string[]> {
        const resources = await this.mcpClient.listResources();
        return resources
            .map((resource) => {
                if (typeof resource === 'string') return resource;
                if (resource?.uri) {
                    try {
                        const uri = new URL(resource.uri);
                        return uri.pathname.replace(WORKSPACE_PATH, '').replace(/^\//, '');
                    } catch {
                        return resource.uri;
                    }
                }
                if (resource?.name) return resource.name;
                return '';
            })
            .filter(Boolean);
    }

    getListResourcesTool() {
        return tool(
            async ({ relDir }: { relDir?: string }) => {
                const resources = await this.formatResources();
                const filtered = relDir
                    ? resources.filter((res) => res.startsWith(relDir))
                    : resources;
                return filtered.length ? filtered.join('\n') : 'No files found.';
            },
            {
                name: 'list_resources',
                description: 'List resources available in the workspace via MCP',
                schema: z.object({ relDir: z.string().optional().describe('Relative directory prefix to filter resources') }),
            }
        );
    }

    getReadResourceTool() {
        return tool(
            async ({ uri }: { uri: string }) => {
                const normalizedUri = this.normalizeUri(uri);
                return await this.mcpClient.readResource(normalizedUri);
            },
            {
                name: 'read_resource',
                description: 'Read a resource via MCP (accepts absolute file:// URI or workspace-relative path)',
                schema: z.object({ uri: z.string().describe('file:// URI or workspace-relative path to read') }),
            }
        );
    }

    getCallToolProxy() {
        return tool(
            async ({ name, input }: { name: string, input?: Record<string, any> }) => {
                return await this.mcpClient.callTool(name, input ?? {});
            },
            {
                name: 'call_tool',
                description: 'Proxy to call any MCP tool exposed by the filesystem server',
                schema: z.object({
                    name: z.string().describe('Tool name to call, e.g., write_file or make_directory'),
                    input: z.record(z.any()).optional().describe('Arguments for the target tool'),
                }),
            }
        );
    }

    getRepoMapTool() {
        return tool(
            async ({ maxDepth = 5 }: { maxDepth?: number }) => {
                return await this.repoMapService.generateRepoMap(maxDepth);
            },
            {
                name: 'repo_map',
                description: 'Generate an ASCII tree of the repository respecting .gitignore and common noise directories',
                schema: z.object({
                    maxDepth: z.number().min(1).max(10).optional().describe('Maximum depth for the tree rendering'),
                }),
            }
        );
    }

    getRunCmdTool() {
        return tool(
            ({ command }) => {
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
            {
                name: 'run_cmd',
                description: 'Run a command',
                schema: z.object({ command: z.string().describe('Command to run') }),
            }
        )
    }

    getPullBaseFilesTool() {
        return tool(
            async ({ language, targetRelPath }: { language: ELanguage; targetRelPath?: string }) => {
                const targetPath = targetRelPath && targetRelPath.trim().length > 0
                    ? `${WORKSPACE_PATH}/${targetRelPath}`
                    : WORKSPACE_PATH;

                await this.minioService.fetchMinioFolder(`base/${language}`, targetPath);

                return { success: true, error: null };
            },
            {
                name: 'pull_base_files',
                description: 'Pull base files for a given language/framework into the workspace or a target subfolder',
                schema: z.object({
                    language: z.nativeEnum(ELanguage).describe('Language to pull base files for'),
                    targetRelPath: z.string().optional().describe('Optional relative folder (from workspace root) to place files into'),
                }),
            }
        )
    }

    getCoderTools() {
        return [
            this.getListResourcesTool(),
            this.getReadResourceTool(),
            this.getCallToolProxy(),
            this.getRepoMapTool(),
            this.getRunCmdTool(),
            this.getPullBaseFilesTool(),
        ];
    }

    async readFile(filepath: string): Promise<string> {
        return this.mcpClient.readResource(this.normalizeUri(filepath));
    }
}
