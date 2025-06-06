import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand } from './run-commands';
import { ELanguage } from 'src/global-types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/guard/ws.guard';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
@UseGuards(WsGuard)
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly chokidarService: ChokidarService,
  ) { }

  private INACTIVITY_TIMEOUT_MS = 30 * 1000;
  private connectedSocketsIds = new Set<string>();
  private timeOut: NodeJS.Timeout | null = null;

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

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id}`);

    this.connectedSocketsIds.add(socket.id);

    // clear timeout because a new connection is established
    if (this.timeOut) {
      clearTimeout(this.timeOut);
      this.timeOut = null;
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id}`);
    this.terminalManager.clear(socket.id);

    this.connectedSocketsIds.delete(socket.id);

    if (this.connectedSocketsIds.size === 0) { // if no active sockets, set timeout
      const timeout = setTimeout(() => {
        // TODO: shutdown the resources
        console.log('Inactivity timeout reached...')
      }, this.INACTIVITY_TIMEOUT_MS);

      this.schedulerRegistry.addTimeout(socket.id, timeout);
      this.timeOut = timeout;
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
