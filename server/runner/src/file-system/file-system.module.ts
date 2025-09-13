import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { FileSystemCRUDGateway } from './file-system-crud.gateway';
import { WsGuard } from 'src/guard/ws.guard';
import { WriteGuard } from 'src/guard/write.guard';
import { MultiplayerModule } from 'src/multiplayer/multiplayer.module';
import { FileSystemCRUDService } from './file-system-crud.service';

@Module({
  imports: [
    MultiplayerModule,
  ],
  providers: [
    FileSystemService,
    FileSystemGateway,
    FileSystemCRUDService,
    FileSystemCRUDGateway,
    WsGuard,
    WriteGuard,
  ],
  exports: [FileSystemService, FileSystemCRUDService],
})
export class FileSystemModule { }
