import { Inject, Injectable } from '@nestjs/common';
import { GraphState, TaskPlanSchema, TaskPlan } from '../types';
import { PromptService } from '../prompts.service';
import { ChatOpenAI } from '@langchain/openai';
import { LlmProviderTokens } from '../agent-orchestrator.module';

@Injectable()
export class ArchitectAgent {

    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatOpenAI
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const plan = state.plan;

        if (!plan) {
            throw new Error('Plan is required');
        }

        console.log('🏗️  Architect Agent: Breaking down plan into tasks...');

        const structuredLlm = this.llm.withStructuredOutput<TaskPlan>(TaskPlanSchema);
        const response = await structuredLlm.invoke(
            this.promptService.architectPrompt(JSON.stringify(plan, null, 2))
        );

        if (!response) {
            throw new Error('Architect did not return a valid response.');
        }

        const taskPlan: TaskPlan = {
            ...response,
            plan: plan,
        };

        console.log('✅ Architect Agent: Task plan created');
        console.log(`   - Implementation Steps: ${taskPlan.implementation_steps.length}`);
        console.log(taskPlan.implementation_steps);

        return { task_plan: taskPlan };
    }
}