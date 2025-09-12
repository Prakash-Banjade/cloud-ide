import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileSystemModule } from './file-system/file-system.module';
import { MinioModule } from './minio/minio.module';
import { ChokidarModule } from './chokidar/chokidar.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ProjectModule } from './project/project.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AgentOrchestratorModule } from './agent-orchestrator/agent-orchestrator.module';
import path from 'path';
import * as fs from 'fs';
import { OpenaiModule } from './openai/openai.module';
import { VectorModule } from './vector/vector.module';
import { LocalExecModule } from './local-exec/local-exec.module';

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
    MulterModule.register({
      storage: diskStorage({
        destination: async (_req, file, cb) => {
          // Preserve relative paths sent from client
          const fullPath = file.originalname;
          const dir = path.dirname(fullPath);
          await fs.promises.mkdir(path.join(__dirname, '..', 'uploads', dir), { recursive: true });
          cb(null, path.join(__dirname, '..', 'uploads', dir));
        },
        filename: (_req, file, cb) => {
          cb(null, path.basename(file.originalname));
        },
      }),
      preservePath: true,
    }),
    MinioModule,
    FileSystemModule,
    ChokidarModule,
    ProjectModule,
    AgentOrchestratorModule,
    OpenaiModule,
    VectorModule,
    LocalExecModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class RunnerModule { }
