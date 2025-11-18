import { Controller, Post, Body, Sse, MessageEvent, Query, UseGuards } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { from, map, Observable } from 'rxjs';
import { StreamEvent } from './types/streaming.types';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('vibe')
export class AgentOrchestratorController {
    constructor(private readonly agentService: AgentOrchestratorService) { }

    @Post('chat')
    @UseGuards(AuthGuard)
    async chat(@Body() payload: ChatMessageDto) {
        return this.agentService.runAgent(payload.message);
    }

    /**
      * SSE (Server-Sent Events) streaming endpoint
      * Usage: GET /agent/stream?user_prompt=your_prompt&thread_id=optional_thread
      */
    @Sse('stream')
    stream(
        @Query('user_prompt') userPrompt: string,
        @Query('thread_id') threadId?: string,
    ): Observable<MessageEvent> {
        if (!userPrompt) {
            throw new Error('user_prompt query parameter is required');
        }

        return from(this.agentService.streamAgent(userPrompt, threadId)).pipe(
            map((event: StreamEvent) => ({
                data: event,
            })),
        );
    }
}
