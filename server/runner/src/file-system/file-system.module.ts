import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { TerminalManagerModule } from '../terminal-manager/terminal-manager.module';

@Module({
  imports: [TerminalManagerModule],
  providers: [FileSystemService, FileSystemGateway]
})
export class FileSystemModule { }
