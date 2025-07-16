import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as archiver from 'archiver';
import { UploadDto } from './dto/upload.dto';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProjectService {
    constructor(
        private readonly configService: ConfigService
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
        for (const file of files) {
            console.log(file.path)
            // const relPath = file.fieldname; // or webkitRelativePath equivalent
            // const localPath = path.join("workspace", relPath);
            // await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
            // await fs.promises.rename(file.filepath, localPath);
            // await minioClient.putObject('workspaces', relPath, fs.createReadStream(localPath));
        }
    }
}
