import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { WsGuard } from 'src/guard/ws.guard';
import { WriteGuard } from 'src/guard/write.guard';
import { MultiplayerModule } from 'src/multiplayer/multiplayer.module';
import { ChokidarModule } from 'src/chokidar/chokidar.module';

@Module({
  imports: [
    ChokidarModule,
    MultiplayerModule,
  ],
  providers: [
    FileSystemService,
    FileSystemGateway,
    WsGuard,
    WriteGuard,
  ],
  exports: [FileSystemService],
})
export class FileSystemModule { }
