import { Injectable } from '@nestjs/common';
import chokidar, { FSWatcher } from 'chokidar';
import { Socket } from 'socket.io';
import { SocketEvents, WORKSPACE_PATH } from 'src/CONSTANTS';
import { MinioService } from 'src/minio/minio.service';
import * as fs from 'fs';
import { IGNORED_DIRS } from 'src/file-system/file-system.service';

@Injectable()
export class ChokidarService {
    constructor(
        private readonly minioService: MinioService,
    ) { }

    private fileWatchers = new Map<string, FSWatcher>();

    startProjectSession(replId: string, socket: Socket) {
        console.log('chokidar started for socketId=', socket.id);

        if (this.fileWatchers.has(replId)) {
            this.stopProjectSession(replId);
        }

        const watcher = chokidar.watch(WORKSPACE_PATH, {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles
                ...Array.from(IGNORED_DIRS).map(dir => new RegExp(`^${dir}`)),
            ],
            persistent: true,
            ignoreInitial: true, // don’t fire events for existing files
            depth: 20,
        });

        watcher.on('add', async (filePath: string) => {
            const relPath = this.getRelativePath(filePath);

            /**
             * if file is created, this content will be ""
             * but if the file is renamed, `add` is triggered which causes minio to save an empty file, so we need to read the content
             */
            const content = await new Promise((resolve, reject) => {
                fs.readFile(filePath, "utf8", (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });

            const stringContent = typeof content === 'string' ? content : "";

            // emit event in frontend so that it can update it's tree
            socket.emit(SocketEvents.FILE_CREATED, { path: relPath, content: stringContent });

            // save to minio
            await this.minioService.saveToMinio(`code/${replId}`, relPath, stringContent);
        });

        watcher.on('unlink', async (filePath: string) => {
            const relPath = this.getRelativePath(filePath);
            socket.emit(SocketEvents.FILE_REMOVED, { path: relPath });

            await this.minioService.removeObject(`code/${replId}`, relPath);
        });

        watcher.on('addDir', async (dirPath: string) => {
            const relPath = this.getRelativePath(dirPath);
            socket.emit(SocketEvents.DIR_CREATED, { path: relPath });

            await this.minioService.ensurePrefix(`code/${replId}${relPath}`);
        });

        watcher.on('unlinkDir', async (dirPath: string) => {
            const relPath = this.getRelativePath(dirPath);
            socket.emit(SocketEvents.DIR_REMOVED, { path: relPath });

            await this.minioService.removePrefix(`code/${replId}${relPath}`);
        });

        watcher.on('change', async (filePath: string) => {
            const relPath = this.getRelativePath(filePath);
            socket.emit(SocketEvents.FILE_CHANGED, { path: relPath });
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

    /**
     * Replace \ with / and Remove leading /workspace
     */
    getRelativePath(filePath: string) {
        return filePath.replaceAll('\\', '/').replace(WORKSPACE_PATH, '');
    }
}
