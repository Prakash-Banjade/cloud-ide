import { Module } from '@nestjs/common';
import { MultiplayerGateway } from './multiplayer.gateway';

@Module({
  providers: [
    MultiplayerGateway
  ],
  exports: [MultiplayerGateway]
})
export class MultiplayerModule { }
