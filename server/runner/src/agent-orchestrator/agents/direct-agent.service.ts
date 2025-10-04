import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphState } from '../types';
import { PromptService } from '../prompts.service';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class DirectAgent {
    constructor(
        private readonly promptService: PromptService,
        private readonly llm: ChatOpenAI
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('💬 Direct Agent: Generating response...');

        const response = await this.llm.invoke(userPrompt);
        const directResponse = response.content.toString();

        console.log('✅ Direct Agent: Response generated');

        return {
            direct_response: directResponse,
            status: 'DONE'
        };
    }
}