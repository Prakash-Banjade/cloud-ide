import { Module } from '@nestjs/common';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { OpenAIModule } from 'src/openai/openai.module';
import { MinioModule } from 'src/minio/minio.module';
import { VectorModule } from 'src/vector/vector.module';
import { FileSystemModule } from 'src/file-system/file-system.module';

@Module({
    imports: [
        OpenAIModule,
        MinioModule,
        VectorModule,
        FileSystemModule,
    ],
    controllers: [AgentOrchestratorController],
    providers: [
        AgentOrchestratorService,
    ],
    exports: [AgentOrchestratorService]
})
export class AgentOrchestratorModule { }
