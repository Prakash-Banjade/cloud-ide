import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { SocketEvents } from "src/CONSTANTS";

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
export class ToolsGateway {
    @WebSocketServer()
    server: Server;

    emitItemCreated(path: string, type: 'file' | 'dir', content: string) {
        this.server.emit(SocketEvents.ITEM_CREATED, { path, type, content });
    }

    /**
     * When base image is pulled by agent, this will notify all the connected clients, so that they can refresh
     */
    emitBaseImagePulled(targetPath: string) {
        this.server.emit(SocketEvents.FETCH_DIR, { targetPath });
    }
}