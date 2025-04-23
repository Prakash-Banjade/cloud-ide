import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { MinioModule } from './minio/minio.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProjectsModule,
    MinioModule
  ],
})
export class ApiGatewayModule { }
