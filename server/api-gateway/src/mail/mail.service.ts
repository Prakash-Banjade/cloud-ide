import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { emailConfig, ITemplates } from './mail-service.config';
import { readFileSync } from 'fs';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { join } from 'path';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailVerificationMailDto, ResetPasswordMailEventDto, TwoFAMailEventDto, UserCredentialsEventDto } from './dto/events.dto';
import Mail from 'nodemailer/lib/mailer';
import { ConfigService } from '@nestjs/config';

export enum MailEvents {
    EMAIL_VERIFICATION = 'mail.email-verification',
    RESET_PASSWORD = 'mail.reset-password',
    TWOFA_OTP = 'twofa.otp',
}

const LOGO_URL = "https://www.prakashbanjade.com/_next/image?url=%2Fprofile.jpg"

@Injectable()
export class MailService {
    private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
    private readonly email: string;
    private readonly domain: string;
    private readonly templates: ITemplates;

    constructor(private readonly configService: ConfigService) {
        this.transport = createTransport(emailConfig);
        this.email = `"Qubide" <${emailConfig.auth.user}>`;
        this.domain = this.configService.getOrThrow('CLIENT_URL');

        this.templates = {
            confirmation: MailService.parseTemplate('email-verification-otp.hbs'),
            resetPassword: MailService.parseTemplate('reset-password.hbs'),
            twoFaOtp: MailService.parseTemplate('two-fa-otp.hbs'),
        };
    }

    private static parseTemplate<T>(
        templateName: string,
    ): Handlebars.TemplateDelegate<T> {
        const templateText = readFileSync(
            join(__dirname, 'templates', templateName),
            'utf-8',
        );
        return Handlebars.compile<T>(templateText, { strict: true });
    }

    public async sendEmail(
        to: string,
        subject: string,
        html: string,
        attachments?: Mail.Attachment[]
    ): Promise<SMTPTransport.SentMessageInfo> {
        const result = await this.transport.sendMail({
            from: this.email,
            to,
            subject,
            html,
            attachments,
        });

        const previewUrl = nodemailer.getTestMessageUrl(result);

        console.log(previewUrl)

        return result;
    }

    @OnEvent(MailEvents.EMAIL_VERIFICATION)
    public async sendEmailVerification(dto: EmailVerificationMailDto) {
        const subject = 'Verify your email';
        const html = this.templates.confirmation({
            ...dto,
            link: `${this.domain}/auth/verify-email/${dto.token}`,
            clientUrl: this.domain,
            logo: LOGO_URL
        });
        this.sendEmail(dto.receiverEmail, subject, html);
    }

    @OnEvent(MailEvents.RESET_PASSWORD)
    public async sendResetPasswordLink(dto: ResetPasswordMailEventDto) {
        const { receiverEmail, receiverName } = dto;
        const subject = 'Reset your password';
        const html = this.templates.resetPassword({
            name: receiverName,
            resetLink: `${this.domain}/auth/reset-password/${dto.token}`,
            clientUrl: this.domain,
            logo: LOGO_URL
        });
        this.sendEmail(
            receiverEmail,
            subject,
            html,
        );
    }

    @OnEvent(MailEvents.TWOFA_OTP)
    public async send2faOtpMail(dto: TwoFAMailEventDto) {
        const subject = '2-Step Authentication';
        const html = this.templates.twoFaOtp({
            ...dto,
            otp: dto.otp.toString(),
            clientUrl: this.domain,
            logo: LOGO_URL
        });
        this.sendEmail(dto.receiverEmail, subject, html);
    }

}