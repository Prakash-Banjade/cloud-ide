import { Injectable } from '@nestjs/common';
import { GraphState, PlanSchema, Plan } from '../types';
import { PromptService } from '../prompts.service';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class PlannerAgent {
    constructor(
        private readonly promptService: PromptService,
        private readonly llm: ChatOpenAI
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('🎯 Planner Agent: Creating project plan...');

        const structuredLlm = this.llm.withStructuredOutput<Plan>(PlanSchema);
        const response = await structuredLlm.invoke(this.promptService.plannerPrompt(userPrompt));

        if (!response) {
            throw new Error('Planner did not return a valid response.');
        }

        console.log('✅ Planner Agent: Plan created successfully');
        console.log(`   - Project: ${response.name}`);
        console.log(`   - Tech Stack: ${response.techstack}`);
        console.log(`   - Files: ${response.files.length}`);

        return { plan: response as Plan };
    }
}