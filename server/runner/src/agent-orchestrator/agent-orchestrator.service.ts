import { Injectable } from '@nestjs/common';
import { GraphService } from './graph.service';

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
}