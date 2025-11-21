import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand } from './run-commands';
import { ELanguage } from 'src/global-types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { ConfigService } from '@nestjs/config';
import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { SocketEvents } from 'src/CONSTANTS';
import { WsGuard } from 'src/guard/ws.guard';

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
@UseGuards(WsGuard)
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private replId: string;

  private readonly logger = new Logger(TerminalGateway.name);

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly kubernetesService: KubernetesService,
    private readonly configService: ConfigService,
  ) {
    this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
  }

  private INACTIVITY_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes
  private connectedSocketsIds = new Set<string>();
  private timeOut: NodeJS.Timeout | null = null;
  private TIMER_NAME = 'timeout';

  async handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id}`);

    socket.join(this.replId); // join project room

    this.connectedSocketsIds.add(socket.id);

    // clear timeout because a new connection is established
    this.stopInactivityTimer();
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id}`);
    this.terminalManager.clear(socket.id);

    this.connectedSocketsIds.delete(socket.id);

    if (this.connectedSocketsIds.size === 0 && this.replId) { // if no active sockets, set timeout
      this.startInactivityTimer();
    }
  }

  // as the module is initialized, immediately start the timer, because there is a chance that socket connection never happens
  // which leads to never shutting down the resources
  onModuleInit() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    if (!isProduction) return; // only in production

    this.stopInactivityTimer();
    this.logger.log('🕒 Starting inactivity timer for terminal gateway - OnModuleInit');
    this.startInactivityTimer();
  }

  private startInactivityTimer() {
    const timeout = setTimeout(() => {
      this.kubernetesService.shutdown(this.replId);
    }, this.INACTIVITY_TIMEOUT_MS);

    this.schedulerRegistry.addTimeout(this.TIMER_NAME, timeout);
    this.timeOut = timeout;
  }

  private stopInactivityTimer() {
    if (this.timeOut) {
      this.schedulerRegistry.deleteTimeout(this.TIMER_NAME);
      clearTimeout(this.timeOut);
      this.timeOut = null;
    }
  }

  @SubscribeMessage(SocketEvents.TERMINAL_REQUEST)
  onRequestTerminal(@ConnectedSocket() socket: Socket) {
    this.terminalManager.createPty(
      socket,
      (data) => {
        socket.emit(SocketEvents.TERMINAL, { data: Buffer.from(data, 'utf-8') });
      },
    );
  }

  @SubscribeMessage(SocketEvents.TERMINAL_DATA)
  onTerminalData(@MessageBody() payload: { data: string }, @ConnectedSocket() socket: Socket) {
       this.terminalManager.write(socket.id, payload.data);
  }

  @SubscribeMessage(SocketEvents.PROCESS_RUN)
  onRun(@MessageBody() payload: { lang: ELanguage, path?: string }, @ConnectedSocket() socket: Socket): { error: string | null } {
    const cmd = getRunCommand(payload.lang, payload.path);

    if (!cmd) return {
      error: 'Language not supported',
    }

    this.terminalManager.write(socket.id, cmd + '\r');

    return { error: null };
  }
}
