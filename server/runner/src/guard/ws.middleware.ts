import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

type SocketMiddleware = (
    socket: Socket,
    next: (err?: Error) => void,
) => void;

export const AuthWsMiddleware = (
    jwtService: JwtService,
): SocketMiddleware => {
    return async (socket: Socket, next) => {
        try {
            const token = socket.handshake?.auth?.token;

            if (!token) {
                throw new WsException("Authorization token is missing");
            }

            try {
                await jwtService.verify(token);
            } catch (error) {
                throw new Error("Authorization token is invalid");
            }

            next();
        } catch (error) {
            next(new WsException("Unauthorized"));
        }
    };
};