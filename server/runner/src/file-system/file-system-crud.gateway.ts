import { MinioService } from "src/minio/minio.service";
import { TerminalManagerService } from "src/terminal-manager/terminal-manager.service";
import { FileSystemService } from "./file-system.service";
import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { WsGuard } from "src/guard/ws.guard";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
})
// @UseGuards(WsGuard)
export class FileSystemCRUDGateway {
    @WebSocketServer()
    server: Server;

    private replId: string;

    constructor(
        private readonly minioService: MinioService,
        private readonly fileSystemService: FileSystemService,
        private readonly terminalManager: TerminalManagerService,
        private readonly configService: ConfigService,
    ) {
        // this.replId = this.configService.get('REPL_ID') as string;
        this.replId = "node-node";
    }

    /**
     * Create either an empty file or an empty directory at `payload.path`.
     */
    @SubscribeMessage('createItem')
    async onCreateItem(
        @MessageBody() payload: { path: string, type: 'file' | 'dir' },
        @ConnectedSocket() socket: Socket
    ): Promise<{ success: boolean, error: string | null }> {
        try {
            const { path, type } = payload;
            const fullPath = `/workspace${path}`;

            if (type === 'dir') {
                // create an on-disk folder
                await this.fileSystemService.createDir(fullPath);
                // mirror into Minio under same prefix
                await this.minioService.ensurePrefix(`code/${this.replId}${path}`);
            } else {
                // create an empty file
                await this.fileSystemService.createFile(fullPath, '');
                // push empty content into Minio
                await this.minioService.saveToMinio(`code/${this.replId}`, path, '');
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('createItem failed', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Delete a file or directory (recursively) at payload.path.
     */
    @SubscribeMessage('deleteItem')
    async onDeleteItem(
        @MessageBody() payload: { path: string, type: 'file' | 'dir' },
        @ConnectedSocket() socket: Socket
    ): Promise<boolean> {
        try {
            const { path, type } = payload;
            const fullPath = `/workspace${path}`;

            // delete on disk (recursive for dirs)
            await this.fileSystemService.deletePath(fullPath);

            // remove from Minio: if it's a folder, remove all objects under that prefix
            if (type === 'dir') {
                await this.minioService.removePrefix(`code/${this.replId}${path}`);
            } else {
                await this.minioService.removeObject(`code/${this.replId}`, path);
            }

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
    ): Promise<{ success: boolean, error: string | null }> {
        try {
            const { oldPath, newPath, type } = payload;
            const fullOld = `/workspace${oldPath}`;
            const fullNew = `/workspace${newPath}`;

            // rename on disk
            await this.fileSystemService.renamePath(fullOld, fullNew);

            // mirror in Minio: move each object from old prefix to new prefix

            if (type === 'dir') {
                // ensure trailing slash so listObjectsV2 will enumerate children :contentReference[oaicite:2]{index=2}
                const srcPrefix = `code/${this.replId}${oldPath.endsWith('/') ? oldPath : oldPath + '/'}`;
                const dstPrefix = `code/${this.replId}${newPath.endsWith('/') ? newPath : newPath + '/'}`;
                await this.minioService.movePrefix(srcPrefix, dstPrefix);
            } else {
                await this.minioService.copyObject(`code/${this.replId}`, oldPath, `code/${this.replId}`, newPath);
                await this.minioService.removeObject(`code/${this.replId}`, oldPath);
            }

            return { success: true, error: null };
        } catch (err) {
            console.error('renameItem failed', err);
            return { success: false, error: err.message };
        }
    }
}