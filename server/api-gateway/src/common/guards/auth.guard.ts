import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { Tokens } from "../CONSTANTS";
import { EnvService } from "src/env/env.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private readonly envService: EnvService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const access_token = this.extractTokenFromHeader(request);
        const refresh_token = this.extractRefreshTokenFromRequest(request);

        if (!access_token || !refresh_token) throw new UnauthorizedException();
        try {
            await this.jwtService.verifyAsync(refresh_token, {
                secret: this.envService.REFRESH_TOKEN_SECRET,
            })

            const payload = await this.jwtService.verifyAsync(access_token, {
                secret: this.envService.ACCESS_TOKEN_SECRET,
            });

            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: FastifyRequest): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private extractRefreshTokenFromRequest(request: FastifyRequest): string | undefined {
        const token: string | undefined = request.cookies[Tokens.REFRESH_TOKEN_COOKIE_NAME];

        if (!token) {
            throw new UnauthorizedException();
        }

        const { valid, value } = request.unsignCookie(token);

        if (!valid) {
            throw new UnauthorizedException();
        }

        return value;
    }
}
