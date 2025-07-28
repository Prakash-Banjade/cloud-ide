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

    async upload(files: Array<Express.Multer.File>, parentPath: string) {
        const uploadPromises = files.map(file => {
            const key = `code/${this.configService.getOrThrow('REPL_ID')}`;
            const filePath = `${file.originalname}`;
            return this.minioService.saveToMinio(key, filePath, file.buffer || fs.createReadStream(file.path));
        });

        await Promise.all(uploadPromises);

        const tree = this.buildFileTreeFromUploads(files, parentPath ?? "");

        return tree;
    }

    private buildFileTreeFromUploads(
        files: Express.Multer.File[],
        parentPath = ''  // e.g. "/layouts/hero"
    ): TreeItem[] {
        // normalize parentPath, remove trailing slash but keep leading slash if present
        const cleanParent = parentPath
            .replace(/\/+$/, '')
            .replace(/^\/?/, '/');

        // length of the prefix including trailing slash, e.g. "/a/b/".length === 4
        const prefix = cleanParent === '/' ? '/' : cleanParent + '/';

        const root: TFolderItem[] = [];

        for (const file of files) {
            // skip any file not under our parentPath
            if (cleanParent !== '/' && !file.originalname.startsWith(prefix)) {
                continue;
            }

            // derive the path _relative_ to parent, but keep full for the node.path
            const relative = cleanParent === '/'
                ? file.originalname.replace(/^\/+/, '')
                : file.originalname.slice(prefix.length);

            // skip if outside or empty
            if (!relative) continue;

            const parts = relative.split('/');  // e.g. ["hero.js"] or ["assets","img.png"]
            let currentLevel = root as TreeItem[];
            let cumulative = cleanParent === '/' ? '' : cleanParent;  // Start at parentPath (no trailing slash)

            for (let i = 0; i < parts.length; i++) {
                const name = parts[i];
                cumulative += '/' + name;
                const isFile = i === parts.length - 1;

                if (isFile) {
                    // --- create a file node under this level ---
                    const extMatch = name.match(/\.(\w+)$/);
                    const language = extMatch?.[1];
                    const fileNode: TFileItem = {
                        type: EItemType.FILE,
                        name,
                        path: cumulative,
                        content: undefined,
                        ...(language ? { language } : {}),
                    };
                    currentLevel.push(fileNode);
                } else {
                    // --- descend or create a folder node ---
                    let folder = currentLevel.find(
                        item => item.type === EItemType.DIR && item.name === name
                    ) as TFolderItem;

                    if (!folder) {
                        folder = {
                            type: EItemType.DIR,
                            name,
                            path: cumulative,
                            expanded: false,
                            children: [],
                        };
                        currentLevel.push(folder);
                    }

                    currentLevel = folder.children;
                }
            }
        }

        return root;
    }
}
