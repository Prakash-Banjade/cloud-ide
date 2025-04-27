import { MinioService } from "src/minio/minio.service";
import { TerminalManagerService } from "src/terminal-manager/terminal-manager.service";
import { FileSystemService } from "./file-system.service";
import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class FileSystemCRUDGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly minioService: MinioService,
        private readonly fileSystemService: FileSystemService,
        private readonly terminalManager: TerminalManagerService
    ) { }

    getReplId(socket: Socket) {
        // Split the host by '.' and take the first part as replId
        const host = socket.handshake.headers.host;
        const replId = host?.split('.')[0];

        return "node-node"; // hardcoded for now

        if (!replId) {
            socket.disconnect();
            this.terminalManager.clear(socket.id);
            return;
        }

        return replId;
    }

    /**
     * Create either an empty file or an empty directory at `payload.path`.
     */
    @SubscribeMessage('createItem')
    async onCreateItem(@MessageBody() payload: { path: string, type: 'file' | 'dir' }, @ConnectedSocket() socket: Socket): Promise<boolean> {
        const replId = this.getReplId(socket);

        try {
            const { path, type } = payload;
            const fullPath = `/workspace${path}`;

            if (type === 'dir') {
                // create an on-disk folder
                await this.fileSystemService.createDir(fullPath);
                // mirror into Minio under same prefix
                await this.minioService.ensurePrefix(`code/${replId}${path}`);
            } else {
                // create an empty file
                await this.fileSystemService.createFile(fullPath, '');
                // push empty content into Minio
                await this.minioService.saveToMinio(`code/${replId}`, path, '');
            }

            // broadcast to all clients that a change occurred
            this.server.emit('itemCreated', { path, type });
            return true;
        } catch (err) {
            console.error('createItem failed', err);
            return false;
        }
    }

    /**
     * Delete a file or directory (recursively) at payload.path.
     */
    @SubscribeMessage('deleteItem')
    async onDeleteItem(
        @MessageBody() payload: { path: string },
        @ConnectedSocket() socket: Socket
    ): Promise<boolean> {
        try {
            const { path } = payload;
            const fullPath = `/workspace${path}`;
            const replId = this.getReplId(socket);

            // delete on disk (recursive for dirs)
            await this.fileSystemService.deletePath(fullPath);

            // remove from Minio: if it's a folder, remove all objects under that prefix
            if (path.endsWith('/')) {
                await this.minioService.removePrefix(`code/${replId}${path}`);
            } else {
                await this.minioService.removeObject(`code/${replId}`, path);
            }

            this.server.emit('itemDeleted', { path });
            return true;
        } catch (err) {
            console.error('deleteItem failed', err);
            return false;
        }
    }

    /**
     * Rename or move a file or directory.
     * Assumes payload contains both oldPath and newPath.
     */
    @SubscribeMessage('renameItem')
    async onRenameItem(
        @MessageBody() payload: { oldPath: string, newPath: string, type: 'file' | 'dir' },
        @ConnectedSocket() socket: Socket
    ): Promise<boolean> {
        const replId = this.getReplId(socket);

        try {
            const { oldPath, newPath, type } = payload;
            const fullOld = `/workspace${oldPath}`;
            const fullNew = `/workspace${newPath}`;

            // rename on disk
            await this.fileSystemService.renamePath(fullOld, fullNew);

            // mirror in Minio: move each object from old prefix to new prefix
            if (type === 'dir') {
                await this.minioService.movePrefix(
                    `code/${replId}${oldPath}`,
                    `code/${replId}${newPath}`
                );
            } else {
                await this.minioService.copyObject(
                    `code/${replId}`, oldPath,
                    `code/${replId}`, newPath
                );
                await this.minioService.removeObject(`code/${replId}`, oldPath);
            }

            this.server.emit('itemRenamed', { oldPath, newPath, type });
            return true;
        } catch (err) {
            console.error('renameItem failed', err);
            return false;
        }
    }
}
