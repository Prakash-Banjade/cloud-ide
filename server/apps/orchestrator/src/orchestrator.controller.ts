import { Controller, Get } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';

@Controller()
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get()
  getHello(): string {
    return this.orchestratorService.getHello();
  }
}
