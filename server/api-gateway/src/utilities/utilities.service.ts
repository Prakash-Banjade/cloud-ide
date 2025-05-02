import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuthUser } from 'src/common/global.types';

@Injectable()
export class UtilitiesService {
    constructor(
        @Inject(REQUEST) private readonly request: FastifyRequest,
    ) { }

    getCurrentUser(): AuthUser {
        const currentUser = this.request?.user;
        if (!currentUser) throw new UnauthorizedException("Current user not found");
        return currentUser;
    }
}
