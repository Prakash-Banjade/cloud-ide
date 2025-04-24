import { Module } from '@nestjs/common';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KubernetesModule
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
})
export class OrchestratorModule { }
