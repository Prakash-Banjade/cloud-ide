import { Inject, Injectable } from '@nestjs/common';
import { GraphState } from '../types';
import { PromptService } from '../prompts.service';
import { ChatOpenAI } from '@langchain/openai';
import { ToolsService } from '../tools.service';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LlmProviderTokens } from '../agent-orchestrator.module';

@Injectable()
export class DirectAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatOpenAI,
        private readonly toolsService: ToolsService
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('💬 Direct Agent: Generating response with tool access...');

        // Give direct agent access to read-only tools
        const directTools = [
            this.toolsService.getReadFileTool(),
            this.toolsService.getListFilesTool(),

        ];

        // Create a react agent with tool access
        const reactAgent = createReactAgent({
            llm: this.llm,
            tools: directTools,
        });

        const result = await reactAgent.invoke({
            messages: [
                new SystemMessage(this.promptService.directAgentSystemPrompt()),
                new HumanMessage(userPrompt)
            ],
        });

        // Extract the final response from the agent
        const messages = result.messages;
        const lastMessage = messages[messages.length - 1];
        const directResponse = lastMessage.content.toString();

        console.log('✅ Direct Agent: Response generated');

        return {
            direct_response: directResponse,
            status: 'DONE',
        };
    }
}