import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { MinioModule } from './minio/minio.module';
import { ConfigModule } from '@nestjs/config';
import { KubernetesModule } from './kubernetes/kubernetes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProjectsModule,
    MinioModule,
    KubernetesModule,
  ],
})
export class ApiGatewayModule { }
