import { Injectable } from '@nestjs/common';
import { GraphService } from './graph.service';
import { StreamEvent } from './types/streaming.types';

@Injectable()
export class AgentOrchestratorService {
    constructor(private graphService: GraphService) { }

    async runAgent(userPrompt: string) {
        try {
            const result = await this.graphService.invoke(
                { user_prompt: userPrompt },
                { recursionLimit: 100 }
            );

            console.log('\n📊 Final State:');
            console.log(JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            console.error('Error running agent:', error);
            throw error;
        }
    }

    /**
    * Stream agent execution with real-time events
    */
    async *streamAgent(userPrompt: string, threadId?: string): AsyncGenerator<StreamEvent> {
        try {
            const config = threadId ? { thread_id: threadId } : undefined;

            for await (const event of this.graphService.stream(
                { user_prompt: userPrompt },
                config
            )) {
                yield event;
            }
        } catch (error) {
            console.error('Error streaming agent:', error);
            throw error;
        }
    }
}