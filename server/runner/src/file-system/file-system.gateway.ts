import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MinioService } from '../minio/minio.service';
import { File, FileSystemService } from './file-system.service';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/guard/ws.guard';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
// @UseGuards(WsGuard)
export class FileSystemGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private replId: string;

  constructor(
    private readonly minioService: MinioService,
    private readonly fileSystemService: FileSystemService,
    private readonly configService: ConfigService,
  ) {
    this.replId = this.configService.get('REPL_ID') as string;
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    // Send initial directory listing
    const rootContent = await this.fileSystemService.fetchDir('/workspace', '');
    socket.emit('loaded', { rootContent });
  }

  @SubscribeMessage('fetchDir')
  async onFetchDir(@MessageBody() dir: string): Promise<File[]> {
    const dirPath = dir?.length ? `/workspace/${dir}` : '/workspace';
    const contents = await this.fileSystemService.fetchDir(dirPath, dir);

    return contents; // the data is returned in the cb function in the client
  }

  @SubscribeMessage('fetchContent')
  async onFetchContent(@MessageBody() payload: { path: string }) {
    const fullPath = `/workspace${payload.path}`;
    const data = await this.fileSystemService.fetchFileContent(fullPath);

    return data; // the data is returned in the cb function in the client
  }

  @SubscribeMessage('updateContent')
  async onUpdateContent(@MessageBody() payload: { path: string; content: string }, @ConnectedSocket() socket: Socket) {
    const { path: filePath, content } = payload;
    const fullPath = `/workspace/${filePath}`;
    await this.fileSystemService.saveFile(fullPath, content);

    await this.minioService.saveToMinio(`code/${this.replId}`, filePath, content);

    return true; // need to return something, used in frontend to handle syncing status
  }
}
