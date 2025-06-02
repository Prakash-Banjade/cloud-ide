import { Module } from '@nestjs/common';
import { TerminalManagerService } from './terminal-manager.service';
import { TerminalGateway } from './terminal.gateway';
import { ChokidarModule } from 'src/chokidar/chokidar.module';

@Module({
  imports: [ChokidarModule],
  providers: [TerminalManagerService, TerminalGateway],
  exports: [TerminalManagerService],
})
export class TerminalManagerModule { }
