import { Module } from '@nestjs/common';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { OpenaiModule } from 'src/openai/openai.module';
import { MinioModule } from 'src/minio/minio.module';
import { VectorModule } from 'src/vector/vector.module';
import { LocalExecModule } from 'src/local-exec/local-exec.module';

@Module({
    imports: [
        OpenaiModule,
        MinioModule,
        VectorModule,
        LocalExecModule,
    ],
    controllers: [AgentOrchestratorController],
    providers: [
        AgentOrchestratorService,
    ],
    exports: [AgentOrchestratorService]
})
export class AgentOrchestratorModule { }
