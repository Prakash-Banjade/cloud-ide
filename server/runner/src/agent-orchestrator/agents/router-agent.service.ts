import { Injectable } from '@nestjs/common';
import { GraphState } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { PromptService } from '../prompts.service';

@Injectable()
export class RouterAgent {
    constructor(
        private readonly promptService: PromptService,
        private readonly llm: ChatOpenAI
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