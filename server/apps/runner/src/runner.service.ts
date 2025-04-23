import { Injectable } from '@nestjs/common';

@Injectable()
export class RunnerService {
  getHello(): string {
    return 'Hello World!';
  }
}
