import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, MessageBody, ConnectedSocket, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MinioService } from '../minio/minio.service';
import { File, FileSystemService } from './file-system.service';
import { SocketEvents, WORKSPACE_PATH } from 'src/CONSTANTS';
import { WsGuard } from 'src/guard/ws.guard';
import { ConfigService } from '@nestjs/config';
import { UseGuards } from '@nestjs/common';
import { WriteGuard } from 'src/guard/write.guard';
import { MultiplayerGateway } from 'src/multiplayer/multiplayer.gateway';

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
export class FileSystemGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private replId: string;

  constructor(
    private readonly minioService: MinioService,
    private readonly fileSystemService: FileSystemService,
    private readonly wsGuard: WsGuard,
    private readonly configService: ConfigService,
    private readonly multiplayerGateway: MultiplayerGateway,
  ) {
    this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id} - FileSystemGateway`);

    const isAuthenticated = await this.wsGuard.verifyToken(socket);
    if (!isAuthenticated) return socket.disconnect();

    this.multiplayerGateway.addUser({ socketId: socket.id, user: socket["user"] }); // removal of user is done in multiplayer.gateway

    socket.join(this.replId);

    // Send initial directory listing
    const rootContent = await this.fileSystemService.fetchDir(WORKSPACE_PATH, '');
    const objectLists = this.minioService.getObjectList();
    socket.emit(SocketEvents.TREE_LOADED, { rootContent, objectLists });
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id} - FileSystemGateway`);
  }

  @SubscribeMessage(SocketEvents.FETCH_DIR)
  async onFetchDir(@MessageBody() dir: string): Promise<File[]> {
    const dirPath = dir?.length ? `${WORKSPACE_PATH}/${dir}` : WORKSPACE_PATH;
    const contents = await this.fileSystemService.fetchDir(dirPath, dir);

    return contents; // the data is returned in the cb function in the client
  }

  @SubscribeMessage(SocketEvents.FETCH_CONTENT)
  async onFetchContent(@MessageBody() payload: { path: string }) {
    const fullPath = `${WORKSPACE_PATH}${payload.path}`;
    const data = await this.fileSystemService.fetchFileContent(fullPath);

    return data; // the data is returned in the cb function in the client
  }

  @UseGuards(WriteGuard)
  @SubscribeMessage(SocketEvents.UPDATE_CONTENT)
  async onUpdateContent(@MessageBody() payload: { path: string; content: string }) {
    try {
      const { path: filePath, content } = payload;
      const fullPath = `${WORKSPACE_PATH}${filePath}`;
      await this.fileSystemService.saveFile(fullPath, content);
      await this.minioService.saveToMinio(`code/${this.replId}`, filePath, content);
    } catch (e) {
      console.log(e);
    } finally {
      return true; // need to return something, used in frontend to handle syncing status
    }
  }
}
