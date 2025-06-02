import { Injectable } from '@nestjs/common';
import chokidar, { FSWatcher } from 'chokidar';
import { Socket } from 'socket.io';

@Injectable()
export class ChokidarService {
    private fileWatchers = new Map<string, FSWatcher>();
    startProjectSession(projectPath: string, projectId: string, socket: Socket) {
        console.log('chokidar started....')

        if (!this.fileWatchers.has(projectId)) {
            const watcher = chokidar.watch(projectPath, {
                ignored: /(^|[\/\\])\../, // ignore dotfiles if you like
                persistent: true,
                ignoreInitial: true,     // don’t fire events for existing files—only new changes
                depth: 10,               // how deep into subfolders you want to watch
            });

            // When a file is added…
            watcher.on('add', (filePath: string) => {
                // Strip the project root prefix to get a relative path, e.g. 'src/newFile.js'
                const rel = filePath.replace(projectPath + '/', '');

                console.log({ socketId: socket.id });
                socket.emit('chokidar:file-added', { path: rel });
            });

            // When a file is removed…
            watcher.on('unlink', (filePath: string) => {
                const rel = filePath.replace(projectPath + '/', '');
                socket.emit('chokidar:file-removed', { path: rel });
            });

            // When a directory is added…
            watcher.on('addDir', (dirPath: string) => {
                const rel = dirPath.replace(projectPath + '/', '');
                socket.emit('chokidar:dir-added', { path: rel });
            });

            // When a directory is removed…
            watcher.on('unlinkDir', (dirPath: string) => {
                const rel = dirPath.replace(projectPath + '/', '');
                socket.emit('chokidar:dir-removed', { path: rel });
            });

            // When any file is changed (optional—useful if you show icons or modified-status)
            watcher.on('change', (filePath: string) => {
                const rel = filePath.replace(projectPath + '/', '');
                socket.emit('chokidar:file-changed', { path: rel });
            });

            this.fileWatchers.set(projectId, watcher);
        }
    }
}