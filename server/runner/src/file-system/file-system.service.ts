import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

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
                    resolve(files.map(file => {
                        const isDir = file.isDirectory();

                        return {
                            type: isDir ? "dir" : "file",
                            name: file.name,
                            path: `${baseDir}/${file.name}`,
                            ...(!isDir ? { language: file.name.split('.').pop() } : {}),
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
}
