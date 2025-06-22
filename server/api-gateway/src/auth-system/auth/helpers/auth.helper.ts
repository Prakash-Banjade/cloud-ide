import { BadRequestException, Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import * as crypto from 'crypto'
import { DataSource, IsNull, Not } from "typeorm";
import { FastifyReply, FastifyRequest } from "fastify";
import { REQUEST } from "@nestjs/core";
import { JwtService as JwtSer, TokenExpiredError } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { EncryptionService } from "src/auth-system/encryption/encryption.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IVerifyEncryptedHashTokenPairReturn } from "./interface";
import { EnvService } from "src/env/env.service";
import { UtilitiesService } from "src/utilities/utilities.service";
import { JwtService } from "src/auth-system/jwt/jwt.service";
import { EOptVerificationType, OtpVerificationPending } from "../entities/otp-verification-pending.entity";
import { OtpVerificationDto } from "../dto/auth.dtos";
import { BaseRepository } from "src/common/base.repository";
import { AuthMessage, Tokens } from "src/common/CONSTANTS";
import { generateOtp } from "src/common/utils";
import { MailEvents } from "src/mail/mail.service";
import { EmailVerificationMailDto } from "src/mail/dto/events.dto";

@Injectable({ scope: Scope.REQUEST })
export class AuthHelper extends BaseRepository {
    constructor(
        private readonly datasource: DataSource,
        @Inject(REQUEST) req: FastifyRequest,
        private readonly jwtService: JwtSer,
        private readonly myJwtService: JwtService,
        private readonly envService: EnvService,
        private readonly encryptionService: EncryptionService,
        private readonly eventEmitter: EventEmitter2,
        private readonly utilitiesService: UtilitiesService
    ) {
        super(datasource, req);
    }

    private readonly otpVerificationPendingRepo = this.datasource.getRepository<OtpVerificationPending>(OtpVerificationPending)
    private readonly accountsRepo = this.datasource.getRepository<Account>(Account);

    /**
     * Verification token generation:
     * 
     * 1. Generate a jwt token with email as payload
     * 2. Encrypt the jwt token
     * 3. Hash the encrypted token
     * 4. Save the hashed token in db
     * 5. Send the encrypted token to the user's email
     */
    async generateOtp(account: Account, type: EOptVerificationType, deviceId: string | undefined = undefined) {
        const otpSecret = this.getOtpSecrets(type);

        const otp = generateOtp();
        const verificationToken = await this.jwtService.signAsync(
            { email: account.email },
            {
                secret: otpSecret.secret,
                expiresIn: otpSecret.expiration,
            }
        );

        const encryptedVerificationToken = this.encryptionService.encrypt(verificationToken);

        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(encryptedVerificationToken)
            .digest('hex');

        // delete existing if any
        await this.otpVerificationPendingRepo.delete({ email: account.email, type });

        const otpVerificationPending = this.otpVerificationPendingRepo.create({
            email: account.email,
            otp: String(otp),
            hashedVerificationToken,
            type,
            deviceId
        });
        await this.otpVerificationPendingRepo.save(otpVerificationPending);
        return { otp, encryptedVerificationToken };

    }

    async sendEmailConfirmation(account: Account) {
        const { otp, encryptedVerificationToken } = await this.generateOtp(account, EOptVerificationType.EMAIL_VERIFICATION);

        this.eventEmitter.emit(MailEvents.EMAIL_VERIFICATION, new EmailVerificationMailDto({
            otp,
            expirationMin: this.envService.EMAIL_VERIFICATION_EXPIRATION_SEC / 60,
            receiverEmail: account.email,
            receiverName: account.firstName + ' ' + account.lastName,
            token: encryptedVerificationToken
        }));

        return {
            message: AuthMessage.OTP_SENT_MESSAGE
        }
    }

    async verifyPendingOtp({
        otpVerificationDto,
        type,
        deviceId = null,
    }: {
        otpVerificationDto: OtpVerificationDto,
        type: EOptVerificationType,
        deviceId?: string | null;
    }): Promise<OtpVerificationPending> {
        const { otp, verificationToken } = otpVerificationDto;
        const otpSecret = this.getOtpSecrets(type);

        let payload: { email: string };

        try {
            const decryptedToken = this.encryptionService.decrypt(verificationToken);

            // verify jwt token
            payload = await this.jwtService.verifyAsync(decryptedToken, {
                secret: otpSecret.secret, // get the secret based on type
            });
        } catch (e) {
            if (e instanceof TokenExpiredError) throw new BadRequestException({
                error: AuthMessage.TOKEN_EXPIRED,
                message: 'OTP has been expired'
            });
            throw new BadRequestException('Invalid token');
        }

        const foundRequest = await this.otpVerificationPendingRepo.findOneBy({
            email: payload.email,
            type,
            ...(!!deviceId ? { deviceId } : {})
        });

        if (!foundRequest) throw new BadRequestException('Invalid token received');

        const verificationTokenHash = crypto
            .createHash('sha256')
            .update(verificationToken) // this is supposed to be encrypted token, if not, it's invalid
            .digest('hex')

        // comapre the token has with found request hash
        if (verificationTokenHash !== foundRequest.hashedVerificationToken) throw new BadRequestException('Invalid token received');

        // CHECK IF OTP IS VALID
        const isOtpValid = await bcrypt.compare(String(otp), foundRequest.otp);
        if (!isOtpValid) throw new BadRequestException('Invalid OTP');

        return foundRequest;
    }

    getOtpSecrets(type: EOptVerificationType) {
        const otpVerificationSecrets: Record<EOptVerificationType, { secret: string, expiration: number }> = {
            [EOptVerificationType.EMAIL_VERIFICATION]: {
                secret: this.envService.EMAIL_VERIFICATION_SECRET,
                expiration: this.envService.EMAIL_VERIFICATION_EXPIRATION_SEC
            },
            [EOptVerificationType.TWOFACTOR_VERIFICATION]: {
                secret: this.envService.TWOFACTOR_VERIFICATION_SECRET,
                expiration: this.envService.TWOFACTOR_VERIFICATION_EXPIRATION_SEC
            },
        };

        return otpVerificationSecrets[type];
    }

    /**
     * Returns Account object if credentials are valid. 
     * If account is not verified, send confirmation email
     */
    async validateAccount(email: string, password: string): Promise<Account | { message: string }> {
        const foundAccount = await this.accountsRepo.findOne({
            where: { email },
            relations: { user: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                twoFaEnabledAt: true,
                password: true,
                verifiedAt: true,
                user: { id: true }
            }
        });

        if (!foundAccount) throw new UnauthorizedException(AuthMessage.INVALID_AUTH_CREDENTIALS);

        if (!foundAccount.password) throw new BadRequestException(AuthMessage.PASSWORD_NOT_SET_YET);

        // if account is not verified, send confirmation email
        if (!foundAccount.verifiedAt) return await this.sendEmailConfirmation(foundAccount);

        const isPasswordValid = await bcrypt.compare(
            password,
            foundAccount.password,
        );

        if (!isPasswordValid) throw new UnauthorizedException(AuthMessage.INVALID_AUTH_CREDENTIALS)

        return foundAccount;
    }

    /**
     * Generates a token pair [encrypted, hashedEncryptedToken] for the provided payload with the provided secret and expiration
     * 
     * @returns [encryptedToken, hashedEncryptedToken]
     */
    async getEncryptedHashTokenPair(payload: any, secret: string, expiration: number): Promise<[string, string]> {
        const token = await this.jwtService.signAsync(
            payload,
            {
                secret,
                expiresIn: expiration,
            }
        );

        const encryptedToken = this.encryptionService.encrypt(token);

        const hashedToken = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        return [encryptedToken, hashedToken];
    }

    async verifyEncryptedHashTokenPair<T>(encryptedToken: string, secret: string): Promise<IVerifyEncryptedHashTokenPairReturn<T>> {
        const tokenHash = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        try {
            const decryptedToken = this.encryptionService.decrypt(encryptedToken);
            const payload = await this.jwtService.verifyAsync(decryptedToken, { // verify if the jwt is valid
                secret,
            });

            return { payload, tokenHash, error: null };
        } catch (e) {
            return { payload: null, tokenHash: null, error: e };
        }
    }

    async verifySudoPassword(password: string, reply: FastifyReply) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const account = await this.getRepository(Account).findOne({
            where: { id: accountId, verifiedAt: Not(IsNull()) },
            select: { id: true, password: true }
        });
        if (!account?.password) return { verified: false }; // TODO: fix, verify sudo requires password

        const isPasswordValid = await bcrypt.compare(password, account.password);

        if (!isPasswordValid) return { verified: false };

        const sudoAccessToken = await this.myJwtService.getSudoAccessToken(account.id);

        return reply
            .setCookie(
                Tokens.SUDO_ACCESS_TOKEN_COOKIE_NAME,
                sudoAccessToken,
                {
                    secure: this.envService.NODE_ENV === 'production',
                    httpOnly: true,
                    signed: true,
                    sameSite: this.envService.NODE_ENV === 'production' ? 'none' : 'lax',
                    expires: new Date(Date.now() + (this.envService.SUDO_ACCESS_TOKEN_EXPIRATION_SEC * 1000)),
                    path: '/',
                }
            )
            .header('Content-Type', 'application/json')
            .send({ verified: true })
    }
}