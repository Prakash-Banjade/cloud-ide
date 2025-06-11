import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
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

@Injectable()
export class FileSystemService {

    fetchDir(dir: string, baseDir: string): Promise<File[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files.map(f => {
                        const objWithKeep = f.name.endsWith('.keep');

                        if (objWithKeep) { // empty folders in minio are saved with .keep prefix but we need to create actual directory in the pod
                            const objName = f.name.replace('.keep', '');
                            const dirExists = !fs.existsSync(`${dir}/${objName}`);

                            if (!dirExists) {
                                mkdir(`${dir}/${objName}`, { recursive: true });
                            }
                        }

                        return objWithKeep ? null : f;

                    }).filter(f => !!f).map(file => {
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

    fetchFileContent(file: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(file, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        })
    }

    async saveFile(file: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, content, "utf8", (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    /** Create a directory (including parents) */
    async createDir(dir: string): Promise<void> {
        await mkdir(dir, { recursive: true });       // recursive mkdir :contentReference[oaicite:5]{index=5}
    }

    /** Create an empty file */
    async createFile(file: string, content = ''): Promise<File> {
        await writeFile(file, content, 'utf8');

        return { type: 'file', name: file, path: file };
    }

    /** Delete a file or folder recursively */
    async deletePath(path: string): Promise<void> {
        // rm with { recursive: true, force: true } handles both files and non-empty dirs :contentReference[oaicite:6]{index=6}
        await rm(path, { recursive: true, force: true });
    }

    /** Rename or move a file or folder */
    async renamePath(oldPath: string, newPath: string): Promise<void> {
        await rename(oldPath, newPath);               // fs.rename for move/rename :contentReference[oaicite:7]{index=7}
    }
}
