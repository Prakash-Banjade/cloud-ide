import { ExecutionContext, Injectable } from "@nestjs/common";
import { CanActivate } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";

@Injectable()
export class WsGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'ws') return true;

        const socket: Socket = context.switchToWs().getClient<Socket>();

        await this.verifyToken(socket);

        return true;
    }

    async verifyToken(socket: Socket) {
        const { auth } = socket.handshake;

        const access_token = auth?.access_token;

        if (!access_token) {
            return false;
        }

        try {
            const payload = await this.jwtService.verifyAsync(access_token, {
                secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
            });

            socket['user'] = payload;

            return true;
        } catch (e) {
            return false;
        }
    }
}