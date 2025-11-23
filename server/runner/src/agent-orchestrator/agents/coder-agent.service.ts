import { Inject, Injectable } from '@nestjs/common';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { GraphState, CoderState } from '../types';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PromptService } from '../prompts.service';
import { ChatGroq } from '@langchain/groq';
import { ToolsService } from '../tools.service';
import { LlmProviderTokens } from '../agent-orchestrator.module';

@Injectable()
export class CoderAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatGroq,
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
        console.log(`   - Task: ${currentTask.task_description.substring(0, 100)}...`);

        // Build comprehensive context
        const context = await this.buildTaskContext(
            coderState,
            currentTask.filepath
        );

        const systemPrompt = this.promptService.codingPrompt(state.stack_context);
        const userPrompt = `
            CURRENT TASK (${coderState.current_step_idx + 1}/${steps.length}):
            ${currentTask.task_description}

            TARGET FILE: ${currentTask.filepath}

            ${context}

            INSTRUCTIONS:
            1. Read any related files mentioned in the task using read_resource or list_resources
            2. Implement COMPLETE, WORKING code - no placeholders or TODOs
            3. Ensure all event listeners and function calls are properly connected
            4. Use call_tool (e.g., write_file) to create or update the file with full implementation

            Remember: This file must work seamlessly with the other files in the project.
        `.trim();

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

    private async buildTaskContext(
        coderState: CoderState,
        currentFilepath: string
    ): Promise<string> {
        const contextParts: string[] = [];

        // Add project overview
        const plan = coderState.task_plan.plan;
        if (plan) {
            contextParts.push(`
                PROJECT OVERVIEW:
                - Name: ${plan.name}
                - Tech Stack: ${plan.techstack}
                - Total Files: ${plan.files.length}
            `);
        }

        // Add completed tasks context
        if (coderState.current_step_idx > 0) {
            const completedTasks = coderState.task_plan.implementation_steps
                .slice(0, coderState.current_step_idx)
                .map((task, idx) => `  ${idx + 1}. ${task.filepath} - ${task.task_description.substring(0, 80)}...`)
                .join('\n');

            contextParts.push(`\nCOMPLETED TASKS:\n${completedTasks}`);
        }

        // Add remaining tasks for forward-looking context
        const remainingTasks = coderState.task_plan.implementation_steps
            .slice(coderState.current_step_idx + 1)
            .map((task, idx) => `  ${idx + coderState.current_step_idx + 2}. ${task.filepath}`)
            .join('\n');

        if (remainingTasks) {
            contextParts.push(`\nUPCOMING TASKS:\n${remainingTasks}`);
        }

        // Add related file contents
        contextParts.push('\nRELATED FILES:');
        const relatedFiles = await this.getRelatedFiles(currentFilepath);

        for (const file of relatedFiles) {
            try {
                const content = await this.toolsService.readFile(file);
                if (content) {
                    contextParts.push(`\n--- ${file} ---\n${content}\n--- End of ${file} ---`);
                }
            } catch (error) {
                // File might not exist yet
                contextParts.push(`\n--- ${file} --- (not created yet)`);
            }
        }

        return contextParts.join('\n\n');
    }

    private async getRelatedFiles(currentFilepath: string): Promise<string[]> {
        const ext = currentFilepath.split('.').pop()?.toLowerCase();
        const basename = currentFilepath.split('/').pop()?.split('.')[0];

        // For HTML files, look for related CSS and JS
        if (ext === 'html') {
            return [
                currentFilepath.replace('.html', '.css'),
                currentFilepath.replace('.html', '.js'),
                'styles.css',
                'style.css',
                'app.js',
                'script.js',
                'main.js'
            ].filter(f => f !== currentFilepath);
        }

        // For CSS files, look for related HTML
        if (ext === 'css') {
            return [
                currentFilepath.replace('.css', '.html'),
                'index.html',
                'main.html'
            ].filter(f => f !== currentFilepath);
        }

        // For JS files, look for related HTML and CSS
        if (ext === 'js') {
            return [
                currentFilepath.replace('.js', '.html'),
                currentFilepath.replace('.js', '.css'),
                'index.html',
                'styles.css',
                'style.css'
            ].filter(f => f !== currentFilepath);
        }

        return [];
    }
}