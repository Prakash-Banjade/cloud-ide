import 'fastify';
import { AuthUser } from './common/types/global.type';

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
        accountId?: string;
        deviceId?: string;
    }
}