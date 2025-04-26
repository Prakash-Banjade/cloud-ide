import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MinioModule } from '../minio/minio.module';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [MinioModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, OrchestratorService],
})
export class ProjectsModule { }
