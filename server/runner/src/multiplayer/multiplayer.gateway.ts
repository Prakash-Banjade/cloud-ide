import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from 'src/CONSTANTS';
import { AuthUser } from 'src/guard/ws.guard';

const COLORS = ["#8594F0", "#F08385", "#F0D885"];

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
export class MultiplayerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private replId: string;
  private activeUsers = new Map<string, AuthUser>();

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.replId = this.configService.getOrThrow<string>('REPL_ID')!;
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(`✅ CONNECTED - ${socket.id} - UsersGateway`);
    socket.join(this.replId);
    // emit active users as soon as a new user connects
    this.emitActiveUsers();
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(`🚫 DISCONNECTED - ${socket.id} - UsersGateway`);

    this.activeUsers.delete(socket.id); // remove user

    // emit active users
    this.emitActiveUsers();
    this.server.to(this.replId).emit(SocketEvents.USER_LEFT, { socketId: socket.id });
  }

  addUser({ socketId, user }: { socketId: string, user: AuthUser }) {
    this.activeUsers.set(socketId, user); // add user

    // emit active users
    this.emitActiveUsers();
  }

  emitActiveUsers() {
    const activeUsers = Array.from(this.activeUsers.values()).map((u, i) => {
      return ({
        userId: u.userId,
        name: u.firstName + " " + u.lastName,
        email: u.email,
        color: COLORS[i],
      })
    });

    this.server.to(this.replId).emit(SocketEvents.USERS_ACTIVE, activeUsers);
  }

  @SubscribeMessage(SocketEvents.CURSOR_MOVE)
  onCursorMove(@MessageBody() payload: { path: string; position: any }, @ConnectedSocket() socket: Socket) {
    const user = this.activeUsers.get(socket.id);
    const index = [...this.activeUsers.keys()].indexOf(socket.id);

    const data = {
      socketId: socket.id,
      color: index !== -1 ? COLORS[index] : COLORS[0],
      ...payload,
      user: {
        userId: user?.userId,
        name: user?.firstName + " " + user?.lastName
      },
    };

    socket.to(this.replId).emit(SocketEvents.CURSOR_MOVE, data); // emit to active users
  }

  @SubscribeMessage(SocketEvents.SELECTION_CHANGE)
  onSelectionChange(@MessageBody() payload: { path: string; start: any, end: any }, @ConnectedSocket() socket: Socket) {
    const index = [...this.activeUsers.keys()].indexOf(socket.id);

    const data = {
      socketId: socket.id,
      color: index !== -1 ? COLORS[index] : COLORS[0],
      ...payload,
    }

    socket.to(this.replId).emit(SocketEvents.SELECTION_CHANGE, data); // emit to active users
  }

}
