import { Inject, Injectable } from '@nestjs/common';
import { GraphState } from '../types';
import { PromptService } from '../prompts.service';
import { ToolsService } from '../tools.service';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LlmProviderTokens } from '../agent-orchestrator.module';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

@Injectable()
export class DirectAgent {
    constructor(
        private readonly promptService: PromptService,
        @Inject(LlmProviderTokens.ROUTER_LLM) private readonly llm: ChatGoogleGenerativeAI,
        private readonly toolsService: ToolsService
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const userPrompt = state.user_prompt;
        const messages = state.messages || [];

        if (!userPrompt) {
            throw new Error('User prompt is required');
        }

        console.log('💬 Direct Agent: Generating response with tool access...');

        // Give direct agent access to read-only tools
        const directTools = [
            this.toolsService.getReadResourceTool(),
            this.toolsService.getListResourcesTool(),
            this.toolsService.getRepoMapTool(),
        ];

        // Create a react agent with tool access
        const reactAgent = createReactAgent({
            llm: this.llm,
            tools: directTools,
        });

        // Filter out any existing SystemMessages from history to avoid duplication/errors
        const history = messages.filter(msg => msg._getType() !== 'system');

        const result = await reactAgent.invoke({
            messages: [
                new SystemMessage(this.promptService.directAgentSystemPrompt()),
                ...history
            ],
        });

        // Extract the final response from the agent
        const resultMessages = result.messages;
        const lastMessage = resultMessages[resultMessages.length - 1];
        const directResponse = lastMessage.content.toString();

        console.log('✅ Direct Agent: Response generated: ', directResponse);

        return {
            direct_response: directResponse,
            messages: resultMessages,
            status: 'DONE',
        };
    }
}