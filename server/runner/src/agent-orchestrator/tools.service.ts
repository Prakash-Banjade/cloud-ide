import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import * as path from 'path';
import { existsSync, promises as fs } from 'fs';
import { exec } from 'child_process';
import { FileSystemCRUDService } from 'src/file-system/file-system-crud.service';
import { FileSystemService } from 'src/file-system/file-system.service';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { tool } from '@langchain/core/tools';
import z from 'zod/v3';
import { ToolsGateway } from './tools.gateway';

@Injectable()
export class ToolsService {
    constructor(
        private readonly fileSystemCRUDService: FileSystemCRUDService,
        private readonly fileSystemService: FileSystemService,
        private readonly toolsGateway: ToolsGateway
    ) { }

    getPath(path: string) {
        return path.startsWith(WORKSPACE_PATH)
            ? path
            : path.startsWith('/')
                ? `${WORKSPACE_PATH}${path}`
                : `${WORKSPACE_PATH}/${path}`;
    }

    getCreateItemTool() {
        return tool(
            async ({ content, path, type = 'file' }: { path: string, content: string, type: 'file' | 'dir' }) => {
                const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`;
                console.log(`createItemTool: ${type} at ${pathWithLeadingSlash}`);

                const result = await this.fileSystemCRUDService.createItem({ path: pathWithLeadingSlash, type, content: content ?? '' });
                if (result.success) {
                    // emit to active users
                    this.toolsGateway.emitItemCreated(pathWithLeadingSlash, type, content ?? '');
                }
                return { ok: result.success, error: result.error };
            },
            {
                name: 'create_item',
                description: 'Create a new file or directory in the project',
                schema: z.object({
                    path: z.string().describe('Path to the file or directory with leading slash'),
                    content: z.string().nullable().describe('Content of the file'),
                    type: z.enum(['file', 'dir']).describe('Type of the item'),
                }),
            }
        )
    }

    getReadFileTool() {
        return tool(
            async ({ path }: { path: string }) => {
                const absPath = this.getPath(path);
                console.log(`readFileTool: ${absPath}`);

                return await this.fileSystemService.fetchFileContent(absPath);
            },
            {
                name: 'read_file',
                description: 'Read file',
                schema: z.object({ path: z.string().describe('Path to the file with leading slash') }),
            }
        )
    }

    getListFilesTool() {
        return tool(
            async ({ relDir = '.' }: { relDir: string }) => {
                const dirPath = this.getPath(relDir);
                console.log('Calling listFiles, dirPath = ' + dirPath);

                let entries: string[];
                try {
                    entries = await fs.readdir(dirPath, { withFileTypes: true }).then((ents) =>
                        ents
                            .filter((e) => e.isFile())
                            .map((e) => e.name), // this only lists immediate files
                    );
                } catch (err) {
                    throw new BadRequestException(`${dirPath} is not a directory or cannot be read`);
                }

                if (entries.length === 0) {
                    return 'No files found.';
                }
                // recursive helper:
                const walk = async (
                    cur: string,
                    base: string,
                ): Promise<string[]> => {
                    const results: string[] = [];
                    const dirents = await fs.readdir(cur, { withFileTypes: true });
                    for (const ent of dirents) {
                        const entPath = path.join(cur, ent.name);
                        const rel = path.relative(base, entPath);
                        if (ent.isFile()) {
                            results.push(rel);
                        } else if (ent.isDirectory()) {
                            const children = await walk(entPath, base);
                            for (const c of children) {
                                results.push(c);
                            }
                        }
                    }
                    return results;
                };

                const all = await walk(dirPath, WORKSPACE_PATH);
                return all.join('\n');
            },
            {
                name: 'list_files',
                description: 'List files in a directory',
                schema: z.object({ relDir: z.string().describe('Relative path to the directory') }),
            }
        )
    }

    getRunCmdTool() {
        return tool(
            ({ command }: { command: string }) => {
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

    getAllTools() {
        return [
            this.getCreateItemTool(),
            this.getReadFileTool(),
            this.getListFilesTool(),
            this.getRunCmdTool(),
        ];
    }

    getCoderTools() {
        return [
            this.getCreateItemTool(),
            this.getReadFileTool(),
            this.getListFilesTool(),
        ];
    }

    async readFile(filepath: string): Promise<string> {
        // check if file exists
        const absPath = this.getPath(filepath);
        if (!existsSync(absPath)) {
            return ""
        }

        const tool = this.getReadFileTool();
        return tool.invoke({ path: filepath });
    }
}
