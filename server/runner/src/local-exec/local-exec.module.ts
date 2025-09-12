import { Module } from '@nestjs/common';
import { LocalExecService } from './local-exec.service';

@Module({
  providers: [LocalExecService],
  exports: [LocalExecService],
})
export class LocalExecModule { }
