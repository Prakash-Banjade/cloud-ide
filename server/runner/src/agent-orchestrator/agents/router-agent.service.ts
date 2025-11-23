import { Inject, Injectable } from '@nestjs/common';
import { GraphState } from '../types';
import { PromptService } from '../prompts.service';
import { LlmProviderTokens } from '../agent-orchestrator.module';
import { ChatGroq } from '@langchain/groq';

@Injectable()
export class RouterAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatGroq
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('🔀 Router Agent: Analyzing user prompt...');

        // Use the last message or construct a context aware prompt
        // For now, we just use the user prompt but we could pass history if needed
        const response = await this.llm.invoke(this.promptService.routerPrompt(userPrompt));
        const route = response.content.toString().trim().toLowerCase();

        const finalRoute = route.includes('agent') ? 'agent' : 'direct';

        console.log(`✅ Router Agent: Route decided -> ${finalRoute.toUpperCase()}`);

        return { route: finalRoute as 'agent' | 'direct' };
    }
}