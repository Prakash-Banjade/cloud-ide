import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './jwt/jwt.module';
import { EncryptionModule } from './encryption/encryption.module';
import { WebAuthnModule } from './webAuthn/webAuthn.module';

@Module({
    imports: [
        UsersModule,
        AccountsModule,
        AuthModule,
        JwtModule,
        EncryptionModule,
        WebAuthnModule,
    ]
})
export class AuthSystemModule { }
