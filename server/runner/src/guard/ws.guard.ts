import { ExecutionContext, Injectable } from "@nestjs/common";
import { CanActivate } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
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

        const { auth } = socket.handshake;

        const access_token = auth?.access_token;

        if (!access_token) throw new WsException('Unauthorized');

        try {
            const payload = await this.jwtService.verifyAsync(access_token, {
                secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
            });

            console.log(payload)

            socket['user'] = payload;
        } catch {
            throw new WsException('Unauthorized');
        }

        return true;
    }
}