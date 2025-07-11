import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MinioModule } from '../minio/minio.module';
import { OrchestratorService } from './orchestrator.service';
import { UsersModule } from 'src/auth-system/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { JwtModule } from 'src/auth-system/jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
    ]),
    MinioModule,
    UsersModule,
    JwtModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, OrchestratorService],
})
export class ProjectsModule { }
