import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService as JwtSer } from '@nestjs/jwt';
import { Account } from '../accounts/entities/account.entity';
import { EnvService } from 'src/env/env.service';
import { FastifyRequest } from 'fastify';
import { AuthUser } from '../../common/global.types';
import { generateDeviceId } from '../../common/utils';
import { EPermission } from 'src/collaborators/entities/collaborator.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtService {
    constructor(
        private readonly jwtService: JwtSer,
        private readonly envService: EnvService,
    ) { }

    async createAccessToken(payload: AuthUser): Promise<string> {
        return await this.jwtService.signAsync(payload, {
            secret: this.envService.ACCESS_TOKEN_SECRET,
            expiresIn: this.envService.ACCESS_TOKEN_EXPIRATION_SEC,
        });
    }

    async createRefreshToken(payload: Pick<AuthUser, 'accountId' | 'deviceId'>): Promise<string> {
        return await this.jwtService.signAsync(
            { accountId: payload.accountId, deviceId: payload.deviceId },
            {
                secret: this.envService.REFRESH_TOKEN_SECRET,
                expiresIn: this.envService.REFRESH_TOKEN_EXPIRATION_SEC,
            },
        );
    }

    async getSudoAccessToken(accountId: string): Promise<string> {
        return this.jwtService.signAsync(
            { accountId },
            {
                secret: this.envService.SUDO_ACCESS_TOKEN_SECRET,
                expiresIn: this.envService.SUDO_ACCESS_TOKEN_EXPIRATION_SEC,
            }
        );
    }

    /**
     * the payload will contain additional `classRoomId` if the user is a student
     * @param account the account
     * @returns the access and refresh tokens
     */
    async getAuthTokens(account: Account, req: FastifyRequest) {
        const deviceId = req.deviceId || generateDeviceId(req.headers['user-agent'], req.ip);

        if (!account.user?.id) throw new InternalServerErrorException('Associated user not found');

        const payload: AuthUser = {
            accountId: account.id,
            email: account.email,
            userId: account.user.id,
            deviceId,
            firstName: account.firstName,
            lastName: account.lastName,
        };

        const access_token = await this.createAccessToken(payload);
        const refresh_token = await this.createRefreshToken(payload);

        return { access_token, refresh_token };
    }

    async getAccessTokenWithProjectPermission(payload: Record<string, any>) {
        return await this.jwtService.signAsync(payload, {
            secret: this.envService.ACCESS_TOKEN_SECRET,
            expiresIn: this.envService.ACCESS_TOKEN_EXPIRATION_SEC,
        });
    }
}
