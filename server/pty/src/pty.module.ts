import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminalManagerModule } from './terminal-manager/terminal-manager.module';
import { APP_GUARD } from '@nestjs/core';
import { WsGuard } from './guard/ws.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { KubernetesModule } from './kubernetes/kubernetes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 1000, // 5 req per second
      limit: 5,
    }]),
    KubernetesModule,
    ScheduleModule.forRoot(),
    TerminalManagerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WsGuard,
    }
  ],
})
export class PtyModule { }
