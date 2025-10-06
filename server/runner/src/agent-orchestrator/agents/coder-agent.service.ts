import { Injectable } from '@nestjs/common';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { GraphState, CoderState } from '../types';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptService } from '../prompts.service';
import { ChatOpenAI } from '@langchain/openai';
import { ToolsService } from '../tools.service';

@Injectable()
export class CoderAgent {
    constructor(
        private readonly promptService: PromptService,
        private readonly llm: ChatOpenAI,
        private readonly toolsService: ToolsService
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        let coderState: CoderState = state.coder_state || {
            task_plan: state.task_plan!,
            current_step_idx: 0,
        };

        const steps = coderState.task_plan.implementation_steps;

        if (coderState.current_step_idx >= steps.length) {
            console.log('✅ Coder Agent: All tasks completed!');
            return { coder_state: coderState, status: 'DONE' };
        }

        const currentTask = steps[coderState.current_step_idx];
        console.log(
            `\n👨‍💻 Coder Agent: Working on task ${coderState.current_step_idx + 1}/${steps.length}`
        );
        console.log(`   - File: ${currentTask.filepath}`);
        console.log(`   - Task: ${currentTask.task_description.substring(0, 80)}...`);

        const existingContent = await this.toolsService.readFile(currentTask.filepath);

        const systemPrompt = this.promptService.codingPrompt();
        const userPrompt = `
            Task: ${currentTask.task_description}
            File: ${currentTask.filepath}
            Existing content:
            ${existingContent}

            Use write_file(path, content) to save your changes.
        `;

        const coderTools = this.toolsService.getCoderTools();
        const reactAgent = createReactAgent({
            llm: this.llm,
            tools: coderTools,
        });

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ];

        await reactAgent.invoke({ messages });

        console.log(`✅ Coder Agent: Task ${coderState.current_step_idx + 1} completed`);

        coderState.current_step_idx += 1;

        return { coder_state: coderState };
    }
}