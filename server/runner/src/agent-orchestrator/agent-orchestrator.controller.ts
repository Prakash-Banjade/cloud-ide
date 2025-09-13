import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    Sse,
    MessageEvent,
} from '@nestjs/common';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { Observable } from 'rxjs';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('vibe')
export class AgentOrchestratorController {
    constructor(private readonly orchestrator: AgentOrchestratorService) { }

    @Post('chat')
    async chat(@Body() payload: ChatMessageDto) {
        return this.orchestrator.handleMessage(payload);
    }

    // @Sse('stream')
    // stream(@Body() payload: any): Observable<MessageEvent> {
    //     return this.orchestrator.streamMessage(payload);
    // }
}
