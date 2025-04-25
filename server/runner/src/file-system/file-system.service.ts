import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

interface File {
    type: "file" | "dir";
    name: string;
}

@Injectable()
export class FileSystemService {

    fetchDir(dir: string, baseDir: string): Promise<File[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files.map(file => ({ type: file.isDirectory() ? "dir" : "file", name: file.name, path: `${baseDir}/${file.name}` })));
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
