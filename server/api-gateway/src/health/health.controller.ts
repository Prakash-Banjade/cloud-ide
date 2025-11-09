import { Controller, Get, HttpStatus, Res, OnModuleInit } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { createClient, RedisClientType } from '@keyv/redis';
import { Public } from 'src/common/decorators/public.decorator';

const pool = new Pool({
    connectionString: `postgres://${process.env.PG_USER}:${process.env.PG_PWD}@${process.env.PG_HOST}:5432/${process.env.PG_DB}`,
});

@Controller('health')
export class HealthController implements OnModuleInit {
    private redisClient: RedisClientType;

    async onModuleInit() {
        this.redisClient = createClient({ url: process.env.REDIS_URL });
        this.redisClient.on('error', (err) => console.error('Redis error:', err));
        await this.redisClient.connect();
    }

    @Public()
    @Get()
    async getHealth(@Res() res: FastifyReply) {
        try {
            await pool.query('SELECT 1');
            await this.redisClient.ping();
            return res.status(HttpStatus.OK).send({ status: 'ok', database: 'up', redis: 'up' });
        } catch (e) {
            return res
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .send({ status: 'error', message: e.message });
        }
    }
}
