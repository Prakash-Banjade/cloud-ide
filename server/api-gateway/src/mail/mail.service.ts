import { Injectable, Logger } from '@nestjs/common';
import { ITemplates } from './mail-service.config';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { join } from 'path';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailVerificationMailDto, ResetPasswordMailEventDto, SendInvitationEventDto, TwoFAMailEventDto } from './dto/events.dto';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export enum MailEvents {
    EMAIL_VERIFICATION = 'mail.email-verification',
    RESET_PASSWORD = 'mail.reset-password',
    TWOFA_OTP = 'mail.two-fa-otp',
    INVITATION = 'mail.invitation',
}

const LOGO_URL = "https://res.cloudinary.com/dbj0ffzhn/image/upload/v1749668908/qubide-logo.png"

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly resend: Resend;
    private readonly domain: string;
    private readonly templates: ITemplates;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(this.configService.getOrThrow("RESEND_API_KEY"));
        this.domain = this.configService.getOrThrow('CLIENT_URL');

        this.templates = {
            confirmation: MailService.parseTemplate('email-verification-otp.hbs'),
            resetPassword: MailService.parseTemplate('reset-password.hbs'),
            twoFaOtp: MailService.parseTemplate('two-fa-otp.hbs'),
            invitation: MailService.parseTemplate('invitation.hbs'),
        };
    }

    private static parseTemplate(
        templateName: string,
    ): Handlebars.TemplateDelegate {
        const templateText = readFileSync(
            join(__dirname, 'templates', templateName),
            'utf-8',
        );
        return Handlebars.compile(templateText, { strict: true });
    }

    public async sendEmail(
        to: string,
        subject: string,
        html: string,
    ) {
        const { error } = await this.resend.emails.send({
            from: 'Qubide <noreply@qubide.cloud>',
            to,
            subject,
            html,
        });

        if (error) {
            this.logger.error(error);
        }
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

    @OnEvent(MailEvents.INVITATION)
    public async sendInvitation(dto: SendInvitationEventDto) {
        const subject = 'Invited to a project';
        const html = this.templates.invitation({
            ...dto,
            logo: LOGO_URL
        });
        console.log(dto.url);
        this.sendEmail(dto.receiverEmail, subject, html);
    }

}