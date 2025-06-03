import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MinioService } from '../minio/minio.service';
import { File, FileSystemService } from './file-system.service';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
export class FileSystemGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly minioService: MinioService,
    private readonly fileSystemService: FileSystemService,
  ) { }

  async handleConnection(@ConnectedSocket() socket: Socket) {

    // TODO: Perform authentication
    console.log("user connected")

    // Send initial directory listing
    const rootContent = await this.fileSystemService.fetchDir('/workspace', '');
    socket.emit('loaded', { rootContent });
  }

  getReplId(socket: Socket) {
    // Split the host by '.' and take the first part as replId
    const host = socket.handshake.headers.host;
    const replId = host?.split('.')[0];

    // return "my-react-project"; // hardcoded for now

    if (!replId) {
      socket.disconnect();
      this.terminalManager.clear(socket.id);
      return;
    }

    return replId;
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('user disconnected');
    this.terminalManager.clear(socket.id);
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
    // Use replId stored in terminalManager or a map
    const replId = this.getReplId(socket);

    if (!replId) return;

    await this.minioService.saveToMinio(`code/${replId}`, filePath, content);

    return true; // need to return something, used in frontend to handle syncing status
  }
}
