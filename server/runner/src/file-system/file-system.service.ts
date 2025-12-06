import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { promisify } from 'util';

const rm = promisify(fs.rm);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);

export interface File {
    type: "file" | "dir";
    name: string;
    path: string;
    language?: string
}

export const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.git', 'coverage', '.DS_Store']);

@Injectable()
export class FileSystemService {
    fetchDir(dir: string, baseDir: string): Promise<File[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, { withFileTypes: true }, async (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve((await Promise.all(files.map(async f => {
                        const isDir = f.isDirectory();

                        if (isDir && IGNORED_DIRS.has(f.name)) return null; // ignore node_modules

                        const objWithKeep = f.name.endsWith('.keep');

                        if (objWithKeep) { // empty folders in minio are saved with .keep prefix but we need to create actual directory in the pod
                            const objName = f.name.replace('.keep', '');
                            const dirExists = !fs.existsSync(`${dir}/${objName}`);

                            if (!dirExists) {
                                await mkdir(`${dir}/${objName}`, { recursive: true });
                            }
                        }

                        return objWithKeep ? null : f;

                    }))).filter(f => !!f).map(file => {
                        const isDir = file.isDirectory();

                        return {
                            type: isDir ? "dir" : "file",
                            name: file.name,
                            path: `${baseDir}/${file.name}`,
                            ...(!isDir ? {
                                language: file.name.split('.').pop(),
                                content: undefined // intially content is undefined
                            } : {}),
                        }
                    }));
                }
            });
        });
    }

    /**
     * @param filePath - with leading '/workspace'
     */
    fetchFileContent(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        })
    }

    async updateContent(file: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, content, "utf8", (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async createItem(payload: {
        path: string,
        type: 'file' | 'dir',
        content?: string
    }): Promise<{ success: boolean, error: string | null }> {
        try {
            const { path, type, content = "" } = payload;
            const fullPath = `${WORKSPACE_PATH}${path}`;

            if (type === 'dir') {
                await mkdir(fullPath, { recursive: true });
            } else {
                await writeFile(fullPath, content, 'utf8');
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('createItem failed', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Delete a file or directory (recursively) at payload.path.
     */
    async deleteItem(payload: { path: string, type: 'file' | 'dir' }): Promise<boolean> {
        try {
            const { path } = payload;
            const fullPath = `${WORKSPACE_PATH}${path}`;

            // rm with { recursive: true, force: true } handles both files and non-empty dirs
            await rm(fullPath, { recursive: true, force: true });

            return true;
        } catch (err) {
            console.error('deleteItem failed', err);
            return false;
        }
    }


    /**
     * Rename or move a file or directory.
     * Assumes payload contains both oldPath and newPath.
     */
    async renameItem(payload: { oldPath: string, newPath: string }): Promise<{ success: boolean, error: string | null }> {
        try {
            const { oldPath, newPath } = payload;
            const fullOld = `${WORKSPACE_PATH}${oldPath}`;
            const fullNew = `${WORKSPACE_PATH}${newPath}`;

            await rename(fullOld, fullNew);

            return { success: true, error: null };
        } catch (err) {
            console.error('renameItem failed', err);
            return { success: false, error: err.message };
        }
    }
}
