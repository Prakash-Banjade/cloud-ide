import { Module } from '@nestjs/common';
import { LiveBlockService } from './live-block.service';
import { LiveBlockController } from './live-block.controller';

@Module({
  providers: [LiveBlockService],
  controllers: [LiveBlockController]
})
export class LiveBlockModule {}
