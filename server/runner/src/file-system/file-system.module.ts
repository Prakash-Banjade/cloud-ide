import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { FileSystemCRUDGateway } from './file-system-crud.gateway';
import { WsGuard } from 'src/guard/ws.guard';
import { WriteGuard } from 'src/guard/write.guard';
import { MultiplayerModule } from 'src/multiplayer/multiplayer.module';

@Module({
  imports: [
    MultiplayerModule,
  ],
  providers: [
    FileSystemService,
    FileSystemGateway,
    FileSystemCRUDGateway,
    WsGuard,
    WriteGuard,
  ]
})
export class FileSystemModule { }
