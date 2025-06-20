import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { FileSystemGateway } from './file-system.gateway';
import { FileSystemCRUDGateway } from './file-system-crud.gateway';

@Module({
  providers: [
    FileSystemService,
    FileSystemGateway,
    FileSystemCRUDGateway
  ]
})
export class FileSystemModule { }
