import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    Sse,
    MessageEvent,
    UseGuards,
} from '@nestjs/common';
import { AgentOrchestratorGateway } from './agent-orchestrator.gateway';
import { Observable } from 'rxjs';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('vibe')
@UseGuards(AuthGuard)
export class AgentOrchestratorController {
    constructor(private readonly orchestrator: AgentOrchestratorGateway) { }

    @Post('chat')
    async chat(@Body() payload: ChatMessageDto) {
        return this.orchestrator.handleMessage(payload);
    }

    // @Sse('stream')
    // stream(@Body() payload: any): Observable<MessageEvent> {
    //     return this.orchestrator.streamMessage(payload);
    // }
}
