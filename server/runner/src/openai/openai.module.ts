import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Module({
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenaiModule { }
