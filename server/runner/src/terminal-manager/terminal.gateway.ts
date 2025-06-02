import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand } from './run-commands';
import { ELanguage } from 'src/global-types';
import { ChokidarService } from 'src/chokidar/chokidar.service';
import { PROJECT_PATH } from 'src/CONSTANTS';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class TerminalGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly chokidarService: ChokidarService,
  ) { }

  getReplId(socket: Socket) {
    // Split the host by '.' and take the first part as replId
    const host = socket.handshake.headers.host;
    const replId = host?.split('.')[0];

    return "my-react-project"; // hardcoded for now

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

  @SubscribeMessage('requestTerminal')
  onRequestTerminal(@ConnectedSocket() socket: Socket) {
    const replId = this.getReplId(socket);

    if (!replId) return;

    this.terminalManager.createPty(socket.id, replId, (data) => {
      socket.emit('terminal', { data: Buffer.from(data, 'utf-8') });
      this.chokidarService.startProjectSession(PROJECT_PATH, replId, socket); // start chokidar
    });
  }

  @SubscribeMessage('terminalData')
  onTerminalData(@MessageBody() payload: { data: string }, @ConnectedSocket() socket: Socket) {
    this.terminalManager.write(socket.id, payload.data);
  }

  @SubscribeMessage('cmd-run')
  onRun(@MessageBody() payload: { lang: ELanguage, path?: string }, @ConnectedSocket() socket: Socket) {
    console.log(payload)

    const cmd = getRunCommand(payload.lang, payload.path);

    if (!cmd) return {
      error: 'Language not supported',
      success: false
    }

    this.terminalManager.write(socket.id, cmd + '\r'); // \r is to execute the command
  }
}
