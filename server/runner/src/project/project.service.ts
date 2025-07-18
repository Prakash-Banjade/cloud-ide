import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as archiver from 'archiver';
import * as fs from 'fs';
import { MinioService } from 'src/minio/minio.service';
import { EItemType, TFileItem, TFolderItem, TreeItem } from 'src/tree.types';

@Injectable()
export class ProjectService {
    constructor(
        private readonly configService: ConfigService,
        private readonly minioService: MinioService
    ) { }

    async download(res: Response) {
        const replId = this.configService.getOrThrow('REPL_ID') as string;

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${replId}.zip"`,
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => res.status(500).send({ error: err.message }));

        archive.pipe(res);

        archive.glob('**/*', {
            cwd: `/workspace`,
            ignore: ['node_modules/**', '.git/**', '*.log'],
        });

        await archive.finalize();

        return new StreamableFile(archive);
    }

    async upload(files: Array<Express.Multer.File>) {
        const uploadPromises = files.map(file => {
            const key = `code/${this.configService.getOrThrow('REPL_ID')}`;
            const filePath = `${file.originalname}`;
            return this.minioService.saveToMinio(key, filePath, file.buffer || fs.createReadStream(file.path));
        });

        await Promise.all(uploadPromises);

        console.log(files)
        
        return this.buildFileTreeFromUploads(files);
    }

    // TODO: not working properly
    private buildFileTreeFromUploads(files: Array<Express.Multer.File>): TreeItem[] {
        const root: TFolderItem[] = [];

        for (const file of files) {
            // normalize and split: ["react-js", "src", "App.css"]
            const parts = file.originalname.replace(/^\/+/, '').split('/');

            let currentLevel = root as TreeItem[];
            let cumulativePath = '';

            for (let i = 0; i < parts.length; i++) {
                const name = parts[i];
                cumulativePath += '/' + name;

                const isFile = i === parts.length - 1;
                if (isFile) {
                    // --- add file node ---
                    const extMatch = name.match(/\.(\w+)$/);
                    const language = extMatch?.[1];
                    const fileNode: TFileItem = {
                        type: EItemType.FILE,
                        name,
                        path: cumulativePath,
                        content: undefined,
                        ...(language ? { language } : {}),
                    };
                    currentLevel.push(fileNode);
                } else {
                    // --- ensure folder exists ---
                    let folder = currentLevel.find(
                        (item) => item.type === EItemType.DIR && item.name === name
                    ) as TFolderItem;

                    if (!folder) {
                        folder = {
                            type: EItemType.DIR,
                            name,
                            path: cumulativePath,
                            expanded: false,
                            children: [],
                        };
                        currentLevel.push(folder);
                    }

                    // drill down
                    currentLevel = folder.children;
                }
            }
        }

        return root;
    }
}
