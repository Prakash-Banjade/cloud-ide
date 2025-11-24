import { Injectable } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import { tool } from '@langchain/core/tools';
import z from 'zod/v3';
import { ELanguage } from './types/language.types';
import { MinioService } from 'src/minio/minio.service';
import { McpClientService } from './mcp-client.service';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { RepoMapService } from './repo-map.service';
import * as path from 'path';
import * as fs from 'fs/promises';

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

    async listWorkspacePaths(relDir?: string): Promise<string[]> {
        try {
            const resources = await this.formatResources();
            return relDir
                ? resources.filter((res) => res.startsWith(relDir))
                : resources;
        } catch {
            return [];
        }
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

    getListFilesTool() {
        return tool(
            async ({ relDir, depth = 3 }: { relDir?: string; depth?: number }) => {
                const baseDir = relDir ? path.join(WORKSPACE_PATH, relDir) : WORKSPACE_PATH;
                const maxDepth = Math.min(Math.max(depth ?? 1, 1), 6);

                const walk = async (dir: string, currentDepth: number): Promise<string[]> => {
                    const entries = await fs.readdir(dir, { withFileTypes: true });
                    const results: string[] = [];

                    for (const entry of entries) {
                        if (entry.name.startsWith('.git')) continue;
                        const fullPath = path.join(dir, entry.name);
                        const relPath = path.relative(WORKSPACE_PATH, fullPath);
                        results.push(relPath);

                        if (entry.isDirectory() && currentDepth < maxDepth) {
                            results.push(...(await walk(fullPath, currentDepth + 1)));
                        }
                    }

                    return results;
                };

                try {
                    const files = await walk(baseDir, 1);
                    return files.join('\n');
                } catch (error: any) {
                    return `Failed to list files: ${error?.message ?? error}`;
                }
            },
            {
                name: 'list_files',
                description: 'List files from the workspace up to a maximum depth using the filesystem',
                schema: z.object({
                    relDir: z.string().optional().describe('Optional directory relative to workspace root'),
                    depth: z.number().optional().describe('Maximum depth to traverse (default 3, max 6)'),
                }),
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

    getSearchRepoTool() {
        return tool(
            async ({ query, relDir }: { query: string; relDir?: string }) => {
                const cwd = relDir ? path.join(WORKSPACE_PATH, relDir) : WORKSPACE_PATH;
                const command = `rg --no-heading --line-number --color never "${query.replace(/"/g, '\"')}"`;
                const result = await this.runCommand(command, cwd);
                if (!result.success && result.stderr.includes('rg: command not found')) {
                    return 'ripgrep (rg) is not available in this environment.';
                }
                return result.stdout || result.stderr || 'No matches found.';
            },
            {
                name: 'search_in_repo',
                description: 'Search the repository using ripgrep for a pattern',
                schema: z.object({
                    query: z.string().describe('Search pattern'),
                    relDir: z.string().optional().describe('Optional relative directory to scope the search'),
                }),
            }
        );
    }

    getApplyDiffTool() {
        return tool(
            async ({ diff }: { diff: string }) => {
                const result = await this.applyPatch(diff);
                return result;
            },
            {
                name: 'apply_diff',
                description: 'Apply a unified diff/patch to the workspace using the patch command',
                schema: z.object({ diff: z.string().describe('Unified diff starting with ---/+++ headers') }),
            }
        );
    }

    getRunCommandTool() {
        return tool(
            async ({ command, cwd }: { command: string; cwd?: string }) => {
                return await this.runCommand(command, cwd ? path.join(WORKSPACE_PATH, cwd) : WORKSPACE_PATH);
            },
            {
                name: 'run_command',
                description: 'Run a shell command in the workspace and return stdout/stderr',
                schema: z.object({
                    command: z.string().describe('Command to run'),
                    cwd: z.string().optional().describe('Optional working directory relative to workspace root'),
                }),
            }
        );
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
            this.getListFilesTool(),
            this.getSearchRepoTool(),
            this.getCallToolProxy(),
            this.getRepoMapTool(),
            this.getRunCommandTool(),
            this.getApplyDiffTool(),
            this.getPullBaseFilesTool(),
        ];
    }

    async readFile(filepath: string): Promise<string> {
        return this.mcpClient.readResource(this.normalizeUri(filepath));
    }

    async runCommand(command: string, cwd: string = WORKSPACE_PATH): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null; command: string; cwd: string; }> {
        console.log('Running command:', command, 'cwd:', cwd);
        return new Promise((resolve) => {
            exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                resolve({
                    success: !error,
                    stdout: stdout ?? '',
                    stderr: stderr ?? '',
                    exitCode: (error as any)?.code ?? 0,
                    command,
                    cwd,
                });
            });
        });
    }

    private async applyPatch(diff: string): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number | null; }> {
        return new Promise((resolve) => {
            const patch = spawn('patch', ['-p0', '-N', '-r', '-', '-d', WORKSPACE_PATH]);
            let stdout = '';
            let stderr = '';

            patch.stdout.on('data', (data) => (stdout += data.toString()));
            patch.stderr.on('data', (data) => (stderr += data.toString()));

            patch.on('error', (error) => {
                resolve({ success: false, stdout, stderr: stderr || error.message, exitCode: null });
            });

            patch.on('close', (code) => {
                resolve({ success: code === 0, stdout, stderr, exitCode: code });
            });

            patch.stdin.write(diff);
            patch.stdin.end();
        });
    }
}
