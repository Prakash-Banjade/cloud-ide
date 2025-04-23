import { Controller, Get } from '@nestjs/common';
import { RunnerService } from './runner.service';

@Controller()
export class RunnerController {
  constructor(private readonly runnerService: RunnerService) {}

  @Get()
  getHello(): string {
    return this.runnerService.getHello();
  }
}
