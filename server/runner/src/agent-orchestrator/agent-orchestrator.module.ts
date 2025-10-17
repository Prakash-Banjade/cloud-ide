import { Module } from '@nestjs/common';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { MinioModule } from 'src/minio/minio.module';
import { FileSystemModule } from 'src/file-system/file-system.module';
import { ChatGroq } from '@langchain/groq';
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

export const enum LlmProviderTokens {
    ROUTER_LLM = 'ROUTER_LLM',
    PLANNER_LLM = 'PLANNER_LLM',
    ARCHITECT_LLM = 'ARCHITECT_LLM',
    CODER_LLM = 'CODER_LLM',
    DIRECT_LLM = 'DIRECT_LLM',
    SUMMARY_LLM = 'SUMMARY_LLM'
}

@Module({
    imports: [
        MinioModule,
        FileSystemModule,
    ],
    controllers: [AgentOrchestratorController],
    providers: [
        PromptService,
        {
            provide: LlmProviderTokens.ROUTER_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 }),
        },
        {
            provide: LlmProviderTokens.PLANNER_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.3 }),
        },
        {
            provide: LlmProviderTokens.ARCHITECT_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 }),
        },
        {
            provide: LlmProviderTokens.CODER_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 }),
        },
        {
            provide: LlmProviderTokens.DIRECT_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.5 }),
        },
        {
            provide: LlmProviderTokens.SUMMARY_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.3 }),
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
