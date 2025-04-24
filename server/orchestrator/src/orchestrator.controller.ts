import { Body, Controller, Post } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { ResourceStartDto } from './dto/start-resource.dto';

@Controller()
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) { }

  @Post('start')
  getHello(@Body() resourceStartDto: ResourceStartDto) {
    return this.orchestratorService.startResource(resourceStartDto);
  }
}
