import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as archiver from 'archiver';
import * as fs from 'fs';
import { MinioService } from 'src/minio/minio.service';

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
            const filePath = `/${file.originalname}`;

            return this.minioService.saveToMinio(key, filePath, file.buffer || fs.createReadStream(file.path));
        });

        await Promise.all(uploadPromises);
    }
}
