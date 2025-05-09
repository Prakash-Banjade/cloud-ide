import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthHelper } from './helpers/auth.helper';
import { JwtModule } from '../jwt/jwt.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { RefreshTokenService } from './helpers/refresh-tokens.service';
import { Auth2faHelper } from './helpers/auth-2fa.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginDevice } from '../accounts/entities/login-devices.entity';
import { AuthCron } from './auth.cron';
import { OtpVerificationPending } from './entities/otp-verification-pending.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoginDevice,
      OtpVerificationPending
    ]),
    JwtModule,
    EncryptionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthHelper,
    RefreshTokenService,
    Auth2faHelper,
    AuthCron
  ],
  exports: [AuthService, AuthHelper, RefreshTokenService],
})
export class AuthModule { }
