import { Module } from '@nestjs/common';
import { TerminalManagerService } from './terminal-manager.service';
import { TerminalGateway } from './terminal.gateway';

@Module({
  providers: [TerminalManagerService, TerminalGateway],
  exports: [TerminalManagerService],
})
export class TerminalManagerModule { }
