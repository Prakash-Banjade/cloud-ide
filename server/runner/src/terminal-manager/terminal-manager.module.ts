import { Module } from '@nestjs/common';
import { TerminalManagerService } from './terminal-manager.service';

@Module({
  providers: [TerminalManagerService],
  exports: [TerminalManagerService],
})
export class TerminalManagerModule { }
