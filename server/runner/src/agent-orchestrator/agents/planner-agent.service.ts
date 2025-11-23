import { Inject, Injectable } from '@nestjs/common';
import { GraphState, PlanSchema, Plan } from '../types';
import { PromptService } from '../prompts.service';
import { ChatGroq } from '@langchain/groq';
import { LlmProviderTokens } from '../agent-orchestrator.module';
import { ToolsService } from '../tools.service';

@Injectable()
export class PlannerAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatGroq,
        private readonly toolsService: ToolsService
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('🎯 Planner Agent: Creating project plan...');

        // Check workspace state
        const files = await this.getWorkspaceFiles();
        const workspaceContext = files.length > 0
            ? `Workspace contains existing files:\n${files.join('\n')}`
            : 'Workspace is empty.';

        const structuredLlm = this.llm.withStructuredOutput<Plan>(PlanSchema);
        const response = await structuredLlm.invoke(
            this.promptService.plannerPrompt(userPrompt, workspaceContext)
        );

        if (!response) {
            throw new Error('Planner did not return a valid response.');
        }

        console.log('✅ Planner Agent: Plan created successfully');
        console.log(`   - Project: ${response.name}`);
        console.log(`   - Tech Stack: ${response.techstack}`);
        console.log(`   - Files: ${response.files.length}`);
        console.log(response.files);


        return { plan: response as Plan };
    }

    private async getWorkspaceFiles(): Promise<string[]> {
        try {
            const listFilesTool = this.toolsService.getListFilesTool();
            const result = await listFilesTool.invoke({ relDir: '.' });

            if (typeof result === 'string') {
                if (result === 'No files found.') return [];
                return result.split('\n');
            }
            return [];
        } catch (error) {
            console.warn('Failed to list workspace files:', error);
            return [];
        }
    }
}