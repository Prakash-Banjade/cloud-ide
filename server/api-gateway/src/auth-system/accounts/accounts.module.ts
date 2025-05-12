import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountsCronJob } from './accounts.cron';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginDevice } from './entities/login-devices.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoginDevice
    ]),
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsCronJob],
  exports: [AccountsService],
})
export class AccountsModule { }
