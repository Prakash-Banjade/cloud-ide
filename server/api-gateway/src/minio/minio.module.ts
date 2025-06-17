import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { MINIO_TOKEN } from './minio.decorator';
import { MinioService } from './minio.service';

@Global()
@Module({
    exports: [MinioService],
    providers: [
        {
            inject: [ConfigService],
            provide: MINIO_TOKEN,
            useFactory: async (
                configService: ConfigService,
            ): Promise<Minio.Client> => {
                const client = new Minio.Client({
                    endPoint: configService.getOrThrow("MINIO_ENDPOINT"),
                    port: +configService.getOrThrow("MINIO_PORT"),
                    accessKey: configService.getOrThrow("MINIO_ACCESS_KEY"),
                    secretKey: configService.getOrThrow("MINIO_SECRET_KEY"),
                    useSSL: false, // necessary, bcz the internal communicatio will be over http
                });
                return client;
            },
        },
        MinioService,
    ]
})
export class MinioModule { }