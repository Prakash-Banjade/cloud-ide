import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { EnvService } from "src/env/env.service";
import { REFRESH_TOKEN_HEADER } from "../CONSTANTS";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private readonly envService: EnvService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();

        const refreshToken = this.extractRefreshTokenFromHeader(request);

        if (!refreshToken) throw new ForbiddenException();

        try {
            const { accountId } = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.envService.REFRESH_TOKEN_SECRET,
            });

            request.accountId = accountId;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractRefreshTokenFromHeader(request: FastifyRequest): string | undefined {
        const token = request.headers[REFRESH_TOKEN_HEADER];

        if (!token) return undefined;

        return typeof token === 'string' ? token : undefined;
    }
}
