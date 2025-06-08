import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand } from './run-commands';
import { ELanguage } from 'src/global-types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/guard/ws.guard';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
// @UseGuards(WsGuard)
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private replId: string;

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly kubernetesService: KubernetesService,
    // private readonly chokidarService: ChokidarService,
    private readonly configService: ConfigService,
  ) {
    // this.replId = this.configService.get('REPL_ID') as string;
    this.replId = "node-node";
  }

  private INACTIVITY_TIMEOUT_MS = 30 * 1000;
  private connectedSocketsIds = new Set<string>();
  private timeOut: NodeJS.Timeout | null = null;
  private TIMER_NAME = 'timeout';

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id}`);

    this.connectedSocketsIds.add(socket.id);

    // clear timeout because a new connection is established
    if (this.timeOut) {
      this.schedulerRegistry.deleteTimeout(this.TIMER_NAME);
      clearTimeout(this.timeOut);
      this.timeOut = null;
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id}`);
    this.terminalManager.clear(socket.id);

    this.connectedSocketsIds.delete(socket.id);

    if (this.connectedSocketsIds.size === 0 && this.replId) { // if no active sockets, set timeout
      const timeout = setTimeout(() => {
        this.kubernetesService.shutdown(this.replId);
      }, this.INACTIVITY_TIMEOUT_MS);

      this.schedulerRegistry.addTimeout(this.TIMER_NAME, timeout);
      this.timeOut = timeout;
    }

    // if (replId) {
    //   this.chokidarService.stopProjectSession(replId);
    // }
  }

  @SubscribeMessage('requestTerminal')
  onRequestTerminal(@ConnectedSocket() socket: Socket) {
    // this.chokidarService.startProjectSession(PROJECT_PATH, replId, socket); // start chokidar

    this.terminalManager.createPty(socket, this.replId, (data) => {
      socket.emit('terminal', { data: Buffer.from(data, 'utf-8') });
    });
  }

  @SubscribeMessage('terminalData')
  onTerminalData(@MessageBody() payload: { data: string }, @ConnectedSocket() socket: Socket) {
    this.terminalManager.write(socket.id, payload.data);
  }

  @SubscribeMessage('process:run')
  onRun(@MessageBody() payload: { lang: ELanguage, path?: string }, @ConnectedSocket() socket: Socket) {
    const cmd = getRunCommand(payload.lang, payload.path);

    if (!cmd) return {
      error: 'Language not supported',
    }

    // this.terminalManager.write(socket.id, cmd + '\r'); // \r is to execute the command

    this.terminalManager.run(cmd, (data, id) => {
      socket.emit('terminal', { data: Buffer.from(data, 'utf-8'), id });
    })
  }

  @SubscribeMessage('process:stop')
  onStop() {
    this.terminalManager.stopProcess();

    return true;
  }

  @SubscribeMessage('check-port')
  onCheckPort(@MessageBody() payload: { port: number }) {
    console.log('hi there from check port');
    return this.terminalManager.checkPort(payload.port);
  }
}
