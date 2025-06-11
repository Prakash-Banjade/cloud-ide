import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as archiver from 'archiver';

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
    }
}
