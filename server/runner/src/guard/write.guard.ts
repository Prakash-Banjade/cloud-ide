import { ExecutionContext, Injectable } from "@nestjs/common";
import { CanActivate } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";

@Injectable()
export class WriteGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'ws') return true;

        const socket: Socket = context.switchToWs().getClient<Socket>();

        const { auth } = socket.handshake;

        const access_token = auth?.access_token;

        if (!access_token) {
            socket.disconnect();
            return false;
        }

        try {
            const { permission } = await this.jwtService.verifyAsync(access_token, {
                secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
            });

            if (permission !== 'write') {
                throw new Error();
            }

            return true;
        } catch (e) {
            socket.disconnect();
            return false;
        }
    }
}