import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { MinioModule } from './minio/minio.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { AuthSystemModule } from './auth-system/auth-system.module';
import { EnvModule } from './env/env.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from './datasource/typeorm.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 1000, // 5 req per second
      limit: 5,
    }]),
    EventEmitterModule.forRoot(),
    EnvModule,
    ProjectsModule,
    MinioModule,
    KubernetesModule,
    UtilitiesModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [createKeyv(configService.getOrThrow('REDIS_URL'))],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule,
    AuthSystemModule,
  ],
})
export class ApiGatewayModule { }
