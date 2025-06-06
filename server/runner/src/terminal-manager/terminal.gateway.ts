import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand } from './run-commands';
import { ELanguage } from 'src/global-types';
import { SchedulerRegistry } from '@nestjs/schedule';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly chokidarService: ChokidarService,
  ) { }

  private activeSockets: string[] = []; // socket ids
  private timeoutSockets: string[] = []; // socket ids
  private INACTIVITY_TIMEOUT_MS = 60 * 1000;

  getReplId(socket: Socket) {
    // Split the host by '.' and take the first part as replId
    const host = socket.handshake.headers.host;
    const replId = host?.split('.')[0];

    // return "node-node"; // hardcoded for now

    if (!replId) {
      socket.disconnect();
      this.terminalManager.clear(socket.id);
      return;
    }

    return replId;
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log("user connected - from terminal.gateway v2");

    this.activeSockets.push(socket.id);

    // clear timeout because a new connection is established
    try {
      this.timeoutSockets.forEach(t => {
        console.log(t)
        this.schedulerRegistry.deleteTimeout(t);
      })
    } catch (e) { }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('user disconnected - from terminal.gateway');
    this.terminalManager.clear(socket.id);

    this.activeSockets = this.activeSockets.filter((id) => id !== socket.id);

    const replId = this.getReplId(socket);

    if (this.activeSockets.length === 0 && replId) { // if no active sockets, set timeout
      const timeout = setTimeout(() => {
        // TODO: shutdown the resources
        console.log('Inactivity timeout reached....')
      }, this.INACTIVITY_TIMEOUT_MS);

      this.schedulerRegistry.addTimeout(socket.id, timeout);
      this.timeoutSockets.push(socket.id);
    }

    // if (replId) {
    //   this.chokidarService.stopProjectSession(replId);
    // }
  }

  @SubscribeMessage('requestTerminal')
  onRequestTerminal(@ConnectedSocket() socket: Socket) {
    const replId = this.getReplId(socket);

    if (!replId) return;

    // this.chokidarService.startProjectSession(PROJECT_PATH, replId, socket); // start chokidar

    this.terminalManager.createPty(socket.id, replId, (data) => {
      socket.emit('terminal', { data: Buffer.from(data, 'utf-8') });
    });
  }

  @SubscribeMessage('terminalData')
  onTerminalData(@MessageBody() payload: { data: string }, @ConnectedSocket() socket: Socket) {
    this.terminalManager.write(socket.id, payload.data);
  }

  @SubscribeMessage('cmd-run')
  onRun(@MessageBody() payload: { lang: ELanguage, path?: string }, @ConnectedSocket() socket: Socket) {
    const cmd = getRunCommand(payload.lang, payload.path);

    if (!cmd) return {
      error: 'Language not supported',
    }

    this.terminalManager.write(socket.id, cmd + '\r'); // \r is to execute the command
  }
}
