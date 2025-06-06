import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TNodeEnv = 'development' | 'production' | 'test';

@Injectable()
export class EnvService implements OnModuleInit {
    constructor(
        private readonly configService: ConfigService,
    ) { }

    DATABASE_URL: string;
    REDIS_URL: string;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRATION_SEC: number;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRATION_SEC: number;
    COOKIE_SECRET: string;
    EMAIL_VERIFICATION_SECRET: string;
    EMAIL_VERIFICATION_EXPIRATION_SEC: number;
    FORGOT_PASSWORD_SECRET: string;
    FORGOT_PASSWORD_EXPIRATION_SEC: number;
    SUDO_ACCESS_TOKEN_SECRET: string;
    SUDO_ACCESS_TOKEN_EXPIRATION_SEC: number;
    TWOFACTOR_VERIFICATION_SECRET: string;
    TWOFACTOR_VERIFICATION_EXPIRATION_SEC: number;
    CLIENT_URL: string;
    CLIENT_DOMAIN: string;
    BACKEND_URL: string;
    AES_KEY: string;
    AES_IV: string;
    NODE_ENV: TNodeEnv;
    MAIL_OUTGOING_SERVER: string;
    MAIL_SMTP_PORT: number;
    MAIL_USERNAME: string;
    MAIL_PASSWORD: string;
    STREAM_VIDEO_API_KEY: string;
    STREAM_VIDEO_API_SECRET: string;

    onModuleInit() {
        this.DATABASE_URL = this.configService.getOrThrow<string>('DATABASE_URL');
        this.REDIS_URL = this.configService.getOrThrow<string>('REDIS_URL');
        this.ACCESS_TOKEN_SECRET = this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET');
        this.ACCESS_TOKEN_EXPIRATION_SEC = +this.configService.getOrThrow<string>('ACCESS_TOKEN_EXPIRATION_SEC');
        this.REFRESH_TOKEN_SECRET = this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET');
        this.REFRESH_TOKEN_EXPIRATION_SEC = +this.configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRATION_SEC');
        this.COOKIE_SECRET = this.configService.getOrThrow<string>('COOKIE_SECRET');
        this.EMAIL_VERIFICATION_SECRET = this.configService.getOrThrow<string>('EMAIL_VERIFICATION_SECRET');
        this.EMAIL_VERIFICATION_EXPIRATION_SEC = +this.configService.getOrThrow<string>('EMAIL_VERIFICATION_EXPIRATION_SEC');
        this.FORGOT_PASSWORD_SECRET = this.configService.getOrThrow<string>('FORGOT_PASSWORD_SECRET');
        this.FORGOT_PASSWORD_EXPIRATION_SEC = +this.configService.getOrThrow<string>('FORGOT_PASSWORD_EXPIRATION_SEC');
        this.SUDO_ACCESS_TOKEN_SECRET = this.configService.getOrThrow<string>('SUDO_ACCESS_TOKEN_SECRET');
        this.SUDO_ACCESS_TOKEN_EXPIRATION_SEC = +this.configService.getOrThrow<string>('SUDO_ACCESS_TOKEN_EXPIRATION_SEC');
        this.TWOFACTOR_VERIFICATION_SECRET = this.configService.getOrThrow<string>('TWOFACTOR_VERIFICATION_SECRET');
        this.TWOFACTOR_VERIFICATION_EXPIRATION_SEC = +this.configService.getOrThrow<string>('TWOFACTOR_VERIFICATION_EXPIRATION_SEC');
        this.CLIENT_URL = this.configService.getOrThrow<string>('CLIENT_URL');
        this.CLIENT_DOMAIN = this.configService.getOrThrow<string>('CLIENT_DOMAIN');
        this.BACKEND_URL = this.configService.getOrThrow<string>('BACKEND_URL');
        this.AES_KEY = this.configService.getOrThrow<string>('AES_KEY');
        this.AES_IV = this.configService.getOrThrow<string>('AES_IV');
        this.NODE_ENV = this.configService.getOrThrow<TNodeEnv>('NODE_ENV');
        this.MAIL_OUTGOING_SERVER = this.configService.getOrThrow<string>('MAIL_OUTGOING_SERVER');
        this.MAIL_SMTP_PORT = +this.configService.getOrThrow<string>('MAIL_SMTP_PORT');
        this.MAIL_USERNAME = this.configService.getOrThrow<string>('MAIL_USERNAME');
        this.MAIL_PASSWORD = this.configService.getOrThrow<string>('MAIL_PASSWORD');
        // this.STREAM_VIDEO_API_KEY = this.configService.getOrThrow<string>('STREAM_VIDEO_API_KEY');
        // this.STREAM_VIDEO_API_SECRET = this.configService.getOrThrow<string>('STREAM_VIDEO_API_SECRET');
    }

}
