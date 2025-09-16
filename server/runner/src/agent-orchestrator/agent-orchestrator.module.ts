import { Module } from '@nestjs/common';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { AgentOrchestratorGateway } from './agent-orchestrator.gateway';
import { OpenAIModule } from 'src/openai/openai.module';
import { MinioModule } from 'src/minio/minio.module';
import { FileSystemModule } from 'src/file-system/file-system.module';

@Module({
    imports: [
        OpenAIModule,
        MinioModule,
        FileSystemModule,
    ],
    controllers: [AgentOrchestratorController],
    providers: [
        AgentOrchestratorGateway,
    ],
    exports: [AgentOrchestratorGateway]
})
export class AgentOrchestratorModule { }
