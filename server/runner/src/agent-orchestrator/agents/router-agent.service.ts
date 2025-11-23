import { Inject, Injectable } from '@nestjs/common';
import { GraphState } from '../types';
import { PromptService } from '../prompts.service';
import { LlmProviderTokens } from '../agent-orchestrator.module';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class RouterAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatGoogleGenerativeAI
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('🔀 Router Agent: Analyzing user prompt...');

        const response = await this.llm.invoke(this.promptService.routerPrompt(userPrompt));
        const route = response.content.toString().trim().toLowerCase();

        const finalRoute = route.includes('agent') ? 'agent' : 'direct';

        console.log(`✅ Router Agent: Route decided -> ${finalRoute.toUpperCase()}`);

        return { route: finalRoute as 'agent' | 'direct' };
    }
}