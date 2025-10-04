import { Module } from '@nestjs/common';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { MinioModule } from 'src/minio/minio.module';
import { FileSystemModule } from 'src/file-system/file-system.module';
import { ChatOpenAI } from '@langchain/openai';
import { PromptService } from './prompts.service';
import { PlannerAgent } from './agents/planner-agent.service';
import { ArchitectAgent } from './agents/architech-agent.service';
import { CoderAgent } from './agents/coder-agent.service';
import { GraphService } from './graph.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { ToolsService } from './tools.service';
import { RouterAgent } from './agents/router-agent.service';
import { DirectAgent } from './agents/direct-agent.service';
import { ToolsGateway } from './tools.gateway';

@Module({
    imports: [
        MinioModule,
        FileSystemModule,
    ],
    controllers: [AgentOrchestratorController],
    providers: [
        PromptService,
        {
            provide: ChatOpenAI,
            useFactory: () =>
                new ChatOpenAI({
                    model: 'gpt-4o',
                    temperature: 0.7,
                }),
        },
        ToolsService,
        ToolsGateway, // used to emit fs events
        RouterAgent,
        DirectAgent,
        PlannerAgent,
        ArchitectAgent,
        CoderAgent,
        GraphService,
        AgentOrchestratorService,
    ],
})
export class AgentOrchestratorModule { }
