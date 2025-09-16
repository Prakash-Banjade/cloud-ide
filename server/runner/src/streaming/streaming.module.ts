import { Global, Module } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';

@Global()
@Module({
  providers: [StreamingService],
  controllers: [StreamingController],
  exports: [StreamingService],
})
export class StreamingModule { }
