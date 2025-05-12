import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtModule as Jwt } from '@nestjs/jwt';

@Module({
  imports: [
    Jwt.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET!,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_SEC! },
    }),
  ],
  providers: [
    JwtService,
  ],
  exports: [JwtService],
})
export class JwtModule { }
