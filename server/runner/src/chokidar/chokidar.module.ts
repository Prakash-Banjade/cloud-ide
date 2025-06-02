import { Module } from '@nestjs/common';
import { ChokidarService } from './chokidar.service';

@Module({
  providers: [ChokidarService],
  exports: [ChokidarService],
})
export class ChokidarModule { }
