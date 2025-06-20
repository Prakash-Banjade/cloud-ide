import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { MinioModule } from './minio/minio.module';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthSystemModule } from './auth-system/auth-system.module';
import { EnvModule } from './env/env.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from './datasource/typeorm.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 1000, // 5 req per second
      limit: 5,
    }]),
    EventEmitterModule.forRoot(),
    EnvModule,
    MinioModule,
    KubernetesModule,
    UtilitiesModule,
    ScheduleModule.forRoot(),
    RedisModule,
    TypeOrmModule,
    AuthSystemModule,
    ProjectsModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule { }
