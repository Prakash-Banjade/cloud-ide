import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { TerminalManagerModule } from '../terminal-manager/terminal-manager.module';
import { FileSystemCRUDGateway } from './file-system-crud.gateway';

@Module({
  imports: [TerminalManagerModule],
  providers: [
    FileSystemService,
    FileSystemGateway,
    FileSystemCRUDGateway
  ]
})
export class FileSystemModule { }
