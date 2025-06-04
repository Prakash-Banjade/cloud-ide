import { Injectable } from '@nestjs/common';
import chokidar, { FSWatcher } from 'chokidar';
import { Socket } from 'socket.io';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class ChokidarService {
    constructor(
        private readonly minioService: MinioService,
    ) { }

    private fileWatchers = new Map<string, FSWatcher>();

    startProjectSession(projectPath: string, replId: string, socket: Socket) {
        console.log('chokidar started for socketId=', socket.id);

        if (this.fileWatchers.has(replId)) {
            this.stopProjectSession(replId);
        }

        const watcher = chokidar.watch(projectPath, {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles
                /node_modules/,  // ignore node_modules
                /dist/,
                /build/,
                /.next/
            ],
            persistent: true,
            ignoreInitial: true, // don’t fire events for existing files
            depth: 10,
        });

        watcher.on('add', async (filePath: string) => {
            const relPath = filePath.replace(projectPath, '');

            // emit event in frontend so that it can update it's tree
            socket.emit('chokidar:file-added', { path: relPath });

            // save to minio
            await this.minioService.saveToMinio(`code/${replId}`, relPath, '');
        });

        watcher.on('unlink', async (filePath: string) => {
            const relPath = filePath.replace(projectPath, '');
            socket.emit('chokidar:file-removed', { path: relPath });

            await this.minioService.removeObject(`code/${replId}`, relPath);
        });

        watcher.on('addDir', async (dirPath: string) => {
            const relPath = dirPath.replace(projectPath, '');
            socket.emit('chokidar:dir-added', { path: relPath });

            await this.minioService.ensurePrefix(`code/${replId}${relPath}`);
        });

        watcher.on('unlinkDir', async (dirPath: string) => {
            const relPath = dirPath.replace(projectPath, '');
            socket.emit('chokidar:dir-removed', { path: relPath });

            await this.minioService.removePrefix(`code/${replId}${relPath}`);
        });

        watcher.on('change', (filePath: string) => {
            const relPath = filePath.replace(projectPath, '');
            socket.emit('chokidar:file-changed', { path: relPath });
        });

        // Store the watcher so we can close it later
        this.fileWatchers.set(replId, watcher);
    }

    stopProjectSession(replId: string) {
        const watcher = this.fileWatchers.get(replId);
        if (watcher) {
            watcher.close();          // stops Chokidar’s file watching
            this.fileWatchers.delete(replId);
            console.log(`chokidar stopped for replId=${replId}`);
        }
    }
}
