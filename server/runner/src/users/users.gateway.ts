import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from 'src/CONSTANTS';

@Injectable()
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
export class UsersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private replId: string;
  private activeUsers = new Map<string, { userId: string, email: string, name: string }>();

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id} - UsersGateway`);

    // emit active users as soon as a new user connects
    this.server.to(this.replId).emit(SocketEvents.USERS_ACTIVE, Array.from(this.activeUsers.values()));
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id} - UsersGateway`);

    this.activeUsers.delete(socket.id); // remove user

    // emit active users
    this.server.to(this.replId).emit(SocketEvents.USERS_ACTIVE, Array.from(this.activeUsers.values()));
  }

  addUser({ socketId, ...rest }: { socketId: string, userId: string, email: string, name: string }) {
    this.activeUsers.set(socketId, rest); // add user

    // emit active users
    this.server.to(this.replId).emit(SocketEvents.USERS_ACTIVE, Array.from(this.activeUsers.values()));
  }

}
