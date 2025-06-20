import { ExecutionContext, Injectable } from "@nestjs/common";
import { CanActivate } from "@nestjs/common";
import { Socket } from "socket.io";

@Injectable()
export class WsGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType() !== 'ws') return true;

        const socket: Socket = context.switchToWs().getClient<Socket>();

        const { auth } = socket.handshake;

        const access_token = auth?.access_token;

        console.log(access_token)

        return true;
    }
}