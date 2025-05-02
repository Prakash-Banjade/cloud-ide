import { Global, Module } from '@nestjs/common';
import { UtilitiesService } from './utilities.service';

@Global()
@Module({
  providers: [UtilitiesService],
  exports: [UtilitiesService]
})
export class UtilitiesModule { }
