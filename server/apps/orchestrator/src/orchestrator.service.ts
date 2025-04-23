import { Injectable } from '@nestjs/common';

@Injectable()
export class OrchestratorService {
  getHello(): string {
    return 'Hello World!';
  }
}
