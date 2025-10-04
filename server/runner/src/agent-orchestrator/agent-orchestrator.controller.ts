import {
    Controller,
    Post,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { AgentOrchestratorService } from './agent-orchestrator.service';

@Controller('vibe')
@UseGuards(AuthGuard)
export class AgentOrchestratorController {
    constructor(private readonly orchestrator: AgentOrchestratorService) { }

    @Post('chat')
    async chat(@Body() payload: ChatMessageDto) {
        return this.orchestrator.runAgent(payload.message);
    }
}
