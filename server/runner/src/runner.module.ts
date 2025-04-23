import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminalManagerModule } from './terminal-manager/terminal-manager.module';
import { FileSystemModule } from './file-system/file-system.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TerminalManagerModule,
    MinioModule,
    FileSystemModule,
  ],
})
export class RunnerModule { }
