import { Module, Logger } from '@nestjs/common';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis, { RedisClientOptions } from '@keyv/redis';

@Module({
    imports: [
        CacheModule.registerAsync<CacheModuleOptions>({
            imports: [ConfigModule],
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const logger = new Logger('RedisCache');

                const keyvStore = new KeyvRedis({
                    url: config.getOrThrow<string>('REDIS_URL'),
                    socket: {
                        reconnectStrategy: 500, // retry every 500ms
                        keepAlive: 30000,
                    },
                });

                const keyv = new Keyv<RedisClientOptions>({
                    store: keyvStore,
                    ttl: 5 * 60 * 1000, // default TTL of 5 minutes
                });

                const redisClient = keyv.store.client;

                redisClient.on('error', (err: any) => logger.error('Redis client error', err));
                redisClient.on('connect', () => logger.log('Redis connected'));
                redisClient.on('reconnecting', () => console.log('client is reconnecting'));
                redisClient.on('end', () => logger.warn('Redis connection closed'));

                // catch Keyv‑level errors
                keyv.on('error', (err) => logger.error('Keyv error', err));

                return { store: keyv };
            },
        }),
    ],
})
export class RedisModule { }
