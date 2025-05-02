import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { Tokens } from "../CONSTANTS";
import { EnvService } from "src/env/env.service";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private readonly envService: EnvService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const reply = context.switchToHttp().getResponse<FastifyReply>();
        const refresh_token = request.cookies?.[Tokens.REFRESH_TOKEN_COOKIE_NAME];
        if (!refresh_token) throw new ForbiddenException();

        const { valid, value: refreshCookieValue } = request.unsignCookie(refresh_token);

        if (!valid) throw new ForbiddenException();

        try {
            const { accountId } = await this.jwtService.verifyAsync(refreshCookieValue, {
                secret: this.envService.REFRESH_TOKEN_SECRET,
            })

            request.accountId = accountId;
        } catch {
            reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME)
            throw new UnauthorizedException();
        }
        return true;
    }
}
