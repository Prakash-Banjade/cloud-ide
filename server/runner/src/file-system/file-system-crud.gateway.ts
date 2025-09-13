import { Server, Socket } from 'socket.io';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { SocketEvents } from "src/CONSTANTS";
import { ConfigService } from "@nestjs/config";
import { WriteGuard } from "src/guard/write.guard";
import { UseGuards } from "@nestjs/common";
import { FileSystemCRUDService } from "./file-system-crud.service";

@WebSocketGateway({
    cors: {
        origin: (origin, cb) => {
            if (origin === process.env.CLIENT_URL) {
                cb(null, true);
            } else {
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        methods: ['GET', 'POST'],
    },
})
export class FileSystemCRUDGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private replId: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly fileSystemCRUDService: FileSystemCRUDService,
    ) {
        this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
    }

    handleConnection(@ConnectedSocket() socket: Socket) {
        console.log(`✅ CONNECTED - ${socket.id} - FileSystemCRUDGateway`);
        socket.join(this.replId); // join project room
    }

    handleDisconnect(@ConnectedSocket() socket: Socket) {
        console.log(`🚫 DISCONNECTED - ${socket.id} - FileSystemCRUDGateway`);
    }

    /**
     * Create either an empty file or an empty directory at `payload.path`.
     */
    @UseGuards(WriteGuard)
    @SubscribeMessage(SocketEvents.CREATE_ITEM)
    async onCreateItem(
        @MessageBody() payload: { path: string, type: 'file' | 'dir', content?: string },
        @ConnectedSocket() socket: Socket
    ): Promise<{ success: boolean, error: string | null }> {
        const result = await this.fileSystemCRUDService.createItem(payload);

        if (result.success) {
            // emit to active users
            socket.to(this.replId).emit(SocketEvents.ITEM_CREATED, { path: payload.path, type: payload.type });
        }

        return result;
    }

    /**
     * Delete a file or directory (recursively) at payload.path.
     */
    @UseGuards(WriteGuard)
    @SubscribeMessage(SocketEvents.DELETE_ITEM)
    async onDeleteItem(
        @MessageBody() payload: { path: string, type: 'file' | 'dir' },
        @ConnectedSocket() socket: Socket
    ): Promise<boolean> {
        const success = await this.fileSystemCRUDService.deleteItem(payload);

        if (success) {
            // emit to active users
            socket.to(this.replId).emit(SocketEvents.ITEM_DELETED, { path: payload.path, type: payload.type });
        }

        return success;
    }

    /**
     * Rename or move a file or directory.
     * Assumes payload contains both oldPath and newPath.
     */
    @UseGuards(WriteGuard)
    @SubscribeMessage(SocketEvents.RENAME_ITEM)
    async onRenameItem(
        @MessageBody() payload: { oldPath: string, newPath: string, type: 'file' | 'dir' }
    ): Promise<{ success: boolean, error: string | null }> {
        const result = await this.fileSystemCRUDService.renameItem(payload);

        if (result.success) {
            // emit to active users
            this.server.to(this.replId).emit(SocketEvents.ITEM_RENAMED, { oldPath: payload.oldPath, newPath: payload.newPath });
        }

        return result;
    }
}