import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { OpenAIModule } from 'src/openai/openai.module';

@Module({
  imports: [
    OpenAIModule,
  ],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule { }
