import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, MessageBody, ConnectedSocket, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalManagerService } from '../terminal-manager/terminal-manager.service';
import { getRunCommand, longRunningProcesses } from './run-commands';
import { ELanguage } from 'src/global-types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { ConfigService } from '@nestjs/config';
import { Logger, OnModuleInit } from '@nestjs/common';
import { SocketEvents } from 'src/CONSTANTS';

@WebSocketGateway({
  path: '/',
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
})
// @UseGuards(WsGuard)
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private replId: string;

  private readonly logger = new Logger(TerminalGateway.name);

  constructor(
    private readonly terminalManager: TerminalManagerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly kubernetesService: KubernetesService,
    private readonly configService: ConfigService
    // private readonly chokidarService: ChokidarService,
  ) {
    this.replId = this.configService.get<string>('REPL_ID')!;
  }

  private INACTIVITY_TIMEOUT_MS = 1000 * 60 * 5;
  private connectedSocketsIds = new Set<string>();
  private timeOut: NodeJS.Timeout | null = null;
  private TIMER_NAME = 'timeout';

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id}`);

    socket.join(this.replId); // join project room
    this.server.to(this.replId).emit(SocketEvents.PROCESS_STATUS, { isRunning: this.terminalManager.isRunning() });

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

    // if (replId) {
    //   this.chokidarService.stopProjectSession(replId);
    // }
  }

  // as the module is initialized, immediately start the timer, because there is a chance that socket connection never happens
  // which leads to never shutting down the resources
  onModuleInit() {
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

  @SubscribeMessage(SocketEvents.REQUEST_TERMINAL)
  onRequestTerminal(@ConnectedSocket() socket: Socket) {
    // this.chokidarService.startProjectSession(PROJECT_PATH, replId, socket); // start chokidar

    this.terminalManager.createPty(
      socket,
      (data) => {
        socket.emit(SocketEvents.TERMINAL, { data: Buffer.from(data, 'utf-8') });

        const isProjectRunning = this.terminalManager.isRunning();

        if (isProjectRunning) {
          socket.emit(SocketEvents.TERMINAL, { data: this.terminalManager.getRunScrollback() });
        }
      },
      () => {
        this.server.to(this.replId).emit(SocketEvents.PROCESS_STATUS, { isRunning: true });
      }
    );
  }

  @SubscribeMessage(SocketEvents.TERMINAL_DATA)
  onTerminalData(@MessageBody() payload: { data: string }, @ConnectedSocket() socket: Socket) {
    // Check for Ctrl+C (0x03)
    if (payload.data === '\x03') {
      // kill the runPty
      this.terminalManager.stopProcess();
      this.server.to(this.replId).emit(SocketEvents.PROCESS_STATUS, { isRunning: false });
    }

    this.terminalManager.write(socket.id, payload.data);
  }

  @SubscribeMessage(SocketEvents.PROCESS_RUN)
  onRun(@MessageBody() payload: { lang: ELanguage, path?: string }, @ConnectedSocket() socket: Socket) {
    const cmd = getRunCommand(payload.lang, payload.path);

    if (!cmd) return {
      error: 'Language not supported',
    }

    if (!longRunningProcesses[payload.lang]) {
      this.terminalManager.write(socket.id, cmd + '\r');
      return;
    }

    // this is for long running processes like react, next
    this.terminalManager.run(cmd, (data, id) => {
      socket.emit(SocketEvents.TERMINAL, { data: Buffer.from(data, 'utf-8'), id });
      this.server.to(this.replId).emit(SocketEvents.PROCESS_STATUS, { isRunning: this.terminalManager.isRunning() }); // send the status to all clients
    });
  }

  @SubscribeMessage(SocketEvents.PROCESS_STOP)
  onStop(@ConnectedSocket() socket: Socket) {
    this.terminalManager.stopProcess();

    this.terminalManager.write(socket.id, '\x03'); // write Ctrl+C in the terminal to get a new line
    this.terminalManager.write(socket.id, 'clear\r'); // clear the terminal

    this.server.to(this.replId).emit(SocketEvents.PROCESS_STATUS, { isRunning: false });

    return true;
  }
}
