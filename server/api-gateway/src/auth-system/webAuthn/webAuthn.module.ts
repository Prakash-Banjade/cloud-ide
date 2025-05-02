import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebAuthnService } from './webAuthn.service';
import { WebAuthnController } from './webAuthn.controller';
import { WebAuthnCredential } from './entities/webAuthnCredential.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '../jwt/jwt.module';
import { PasskeyChallenge } from './entities/passkey-challenge.entity';
import { WebAuthnCron } from './webAuthn.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebAuthnCredential,
      PasskeyChallenge,
    ]),
    AuthModule,
    JwtModule,
  ],
  providers: [WebAuthnService, WebAuthnCron],
  controllers: [WebAuthnController]
})
export class WebAuthnModule { }
