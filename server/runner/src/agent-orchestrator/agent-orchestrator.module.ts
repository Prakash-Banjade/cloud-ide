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
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { McpClientService } from './mcp-client.service';
import { TechLeadAgent } from './agents/tech-lead.agent';
import { PromptFactory } from './prompt-factory.service';
import { RepoMapService } from './repo-map.service';

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
        PromptFactory,
        {
            provide: LlmProviderTokens.ROUTER_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 }),
        },
        {
            provide: LlmProviderTokens.PLANNER_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 }),
        },
        {
            provide: LlmProviderTokens.ARCHITECT_LLM,
            useFactory: () => new ChatGoogleGenerativeAI({
                model: "gemini-2.5-flash",
                temperature: 0.2
            }),
        },
        {
            provide: LlmProviderTokens.CODER_LLM,
            useFactory: () => new ChatGoogleGenerativeAI({
                model: "gemini-2.5-flash",
                temperature: 0.1
            }),
        },
        {
            provide: LlmProviderTokens.DIRECT_LLM,
            useFactory: () => new ChatGoogleGenerativeAI({
                model: "gemini-2.0-flash",
                temperature: 0.5
            }),
        },
        {
            provide: LlmProviderTokens.SUMMARY_LLM,
            useFactory: () => new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.5 }),
        },
        McpClientService,
        RepoMapService,
        ToolsService,
        RouterAgent,
        DirectAgent,
        PlannerAgent,
        ArchitectAgent,
        CoderAgent,
        TechLeadAgent,
        GraphService,
        AgentOrchestratorService,
    ],
})
export class AgentOrchestratorModule { }
