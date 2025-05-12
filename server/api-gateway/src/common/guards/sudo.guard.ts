import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { Tokens } from "../CONSTANTS";
import { EnvService } from "src/env/env.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class SudoGuard implements CanActivate {
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
        const reply = context.switchToHttp().getResponse<FastifyReply>();
        const sudo_token = this.extractSudoTokenFromRequest(request);

        if (!sudo_token) throw new ForbiddenException({ message: 'Something is wrong. Please try again.' });

        try {
            const { accountId } = await this.jwtService.verifyAsync(sudo_token, {
                secret: this.envService.SUDO_ACCESS_TOKEN_SECRET,
            });

            request['accountId'] = accountId;
        } catch (e) {
            reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME)
            if (e instanceof TokenExpiredError) {
                throw new ForbiddenException({
                    message: 'Sudo session has been expired. Please try again.',
                })
            } else {
                throw new ForbiddenException({ message: 'Something is wrong. Please try again.' });
            }
        }
        return true;
    }

    private extractSudoTokenFromRequest(request: FastifyRequest): string | undefined {
        const token: string | undefined = request.cookies[Tokens.SUDO_ACCESS_TOKEN_COOKIE_NAME];

        if (!token) {
            throw new ForbiddenException({ message: 'Something is wrong. Please try again.' });
        }

        const { valid, value } = request.unsignCookie(token);

        if (!valid) {
            throw new ForbiddenException({ message: 'Something is wrong. Please try again.' });
        }

        return value;
    }
}
