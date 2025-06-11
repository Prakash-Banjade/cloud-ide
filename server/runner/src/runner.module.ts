import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminalManagerModule } from './terminal-manager/terminal-manager.module';
import { FileSystemModule } from './file-system/file-system.module';
import { MinioModule } from './minio/minio.module';
import { ChokidarModule } from './chokidar/chokidar.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { APP_GUARD } from '@nestjs/core';
import { WsGuard } from './guard/ws.guard';
import { ProjectModule } from './project/project.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET!,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_SEC! },
    }),
    ThrottlerModule.forRoot([{
      ttl: 1000, // 5 req per second
      limit: 5,
    }]),
    KubernetesModule,
    ScheduleModule.forRoot(),
    TerminalManagerModule,
    MinioModule,
    FileSystemModule,
    ChokidarModule,
    ProjectModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WsGuard,
    }
  ],
})
export class RunnerModule { }
