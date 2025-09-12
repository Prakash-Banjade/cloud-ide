import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';

@Module({
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule { }
