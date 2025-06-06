import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminalManagerModule } from './terminal-manager/terminal-manager.module';
import { FileSystemModule } from './file-system/file-system.module';
import { MinioModule } from './minio/minio.module';
import { ChokidarModule } from './chokidar/chokidar.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';

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
    ScheduleModule.forRoot(),
    TerminalManagerModule,
    MinioModule,
    FileSystemModule,
    ChokidarModule,
  ],
})
export class RunnerModule { }
