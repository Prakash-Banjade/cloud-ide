import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { WORKSPACE_PATH } from 'src/CONSTANTS';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: async (_req, file, cb) => {
          // Preserve relative paths sent from client
          const fullPath = file.originalname;
          const dir = path.join(WORKSPACE_PATH, path.dirname(fullPath));
          await fs.promises.mkdir(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, path.basename(file.originalname));
        },
      }),
      preservePath: true,
    }),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule { }
