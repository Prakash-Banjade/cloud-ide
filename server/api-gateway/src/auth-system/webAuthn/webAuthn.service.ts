import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UtilitiesService } from 'src/utilities/utilities.service';
import { DataSource, FindOptionsRelations, FindOptionsSelect, IsNull, Not } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { generateAuthenticationOptions, generateRegistrationOptions, RegistrationResponseJSON, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { EnvService } from 'src/env/env.service';
import { EPasskeyChallengeType, PasskeyChallenge } from './entities/passkey-challenge.entity';
import { WebAuthnCredential } from './entities/webAuthnCredential.entity';
import { AuthVerifyDto } from './dto/login-verify.dto';
import { JwtService } from '../jwt/jwt.service';
import { AuthService } from '../auth/auth.service';
import { AuthChallengeDto } from './dto/login-challenge.dto';
import { LoginDevice } from '../accounts/entities/login-devices.entity';
import { BaseRepository } from '../../common/base.repository';
import { generateDeviceId } from '../../common/utils';
import { Tokens } from '../../common/CONSTANTS';

@Injectable({ scope: Scope.REQUEST })
export class WebAuthnService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) request: FastifyRequest,
        private readonly utilitiesService: UtilitiesService,
        private readonly envService: EnvService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) { super(dataSource, request); }

    async registerPassKey(req: FastifyRequest) {
        const accountIdFromSudoGuard = req['accountId']; // this is available from sudo guard in the controller

        if (!accountIdFromSudoGuard) throw new ForbiddenException('Unauthorized');

        const account = await this.getAccount(
            { id: true, email: true, webAuthnCredentials: { id: true, credentialId: true } },
            { webAuthnCredentials: true }
        );

        if (account.id !== accountIdFromSudoGuard) throw new ForbiddenException('Unauthorized');

        const challengePayload = await generateRegistrationOptions({
            rpID: this.envService.CLIENT_DOMAIN,
            rpName: 'Qubide',
            userName: account.email,
            timeout: 30 * 1000,
            excludeCredentials: account.webAuthnCredentials?.map(c => ({
                id: c.credentialId,
            })) ?? [],
        })

        // remove existing register challenge
        await this.getRepository(PasskeyChallenge).delete({ type: EPasskeyChallengeType.Register, email: account.email });

        // save challenge in db
        await this.getRepository(PasskeyChallenge).save({
            challenge: challengePayload.challenge,
            type: EPasskeyChallengeType.Register,
            email: account.email
        });

        return { challengePayload };
    }

    async verifyRegisterPasskey(payload: RegistrationResponseJSON) {
        const account = await this.getAccount({ id: true, email: true, verifiedAt: true });

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.Register, email: account.email },
            select: { id: true, challenge: true }
        });

        if (!passkeyChallenge) throw new ForbiddenException('Register your passkey first');

        const verificationResult = await verifyRegistrationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: payload,
        })

        if (!verificationResult.verified) throw new ForbiddenException('Invalid passkey');

        const registrationInfo = verificationResult.registrationInfo;

        if (!registrationInfo) throw new ForbiddenException('Invalid passkey');

        // save the verified passkey        
        const newWebAuthn = this.getRepository(WebAuthnCredential).create({
            account,
            credentialId: registrationInfo.credential?.id,
            publicKey: Buffer.from(registrationInfo.credential?.publicKey), // convert Uint8Array to string
            backedUp: registrationInfo.credentialBackedUp,
            counter: registrationInfo.credential?.counter,
            deviceType: registrationInfo.credentialDeviceType,
            transports: registrationInfo.credential.transports,
            name: await this.getCredentialName(account.id),
        })

        await this.getRepository(WebAuthnCredential).save(newWebAuthn);

        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge); // remvoe the challenge now

        return { message: 'Passkey registered. You can now use it to log in.', verified: true };
    }

    async getCredentialName(accountId: string) {
        const defaultName = "MY PASSKEY";

        const credentials = await this.getRepository(WebAuthnCredential).createQueryBuilder('cred')
            .where('cred.accountId = :accountId', { accountId })
            .andWhere('cred.name LIKE :defaultName', { defaultName: `${defaultName} %` })
            .limit(1)
            .select(['cred.id', 'cred.name', 'cred.createdAt'])
            .orderBy('cred.createdAt', 'DESC')
            .getOne();

        return incrementPasskey(credentials?.name ?? defaultName);
    }

    async getAccount(select?: FindOptionsSelect<Account>, relations?: FindOptionsRelations<Account>): Promise<Account> {
        const currentUser = this.utilitiesService.getCurrentUser()

        const account = await this.getRepository(Account).findOne({
            where: { id: currentUser.accountId, verifiedAt: Not(IsNull()) },
            relations: relations,
            select: select ?? { id: true }
        });
        if (!account) throw new InternalServerErrorException('Associated account not found');

        return account;
    }

    async getAuthChallenge(dto: AuthChallengeDto) {
        const account = await this.getRepository(Account).findOne({
            where: { email: dto.email, verifiedAt: Not(IsNull()) },
            relations: { webAuthnCredentials: true },
            select: { id: true, email: true, webAuthnCredentials: { id: true, credentialId: true, transports: true } }
        });
        if (!account) throw new BadRequestException({
            message: 'Invalid email',
            field: 'email'
        });

        if (account.webAuthnCredentials.length === 0) throw new ForbiddenException('You have not registered a passkey');

        const challengePayload = await generateAuthenticationOptions({
            rpID: this.envService.CLIENT_DOMAIN,
            allowCredentials: account.webAuthnCredentials?.map(c => ({
                id: c.credentialId,
                transports: c.transports
            }))
        });

        // remove previous login challenge
        await this.getRepository(PasskeyChallenge).delete({ type: dto.type, email: account.email });

        await this.getRepository(PasskeyChallenge).save({
            challenge: challengePayload.challenge,
            type: dto.type,
            email: account.email
        });

        return { challengePayload };
    }

    async verifyLoginPasskey(dto: AuthVerifyDto, req: FastifyRequest, reply: FastifyReply) {
        const account = await this.getRepository(Account).createQueryBuilder('account')
            .where('account.email = :email', { email: dto.email })
            .andWhere('account.verifiedAt IS NOT NULL')
            .leftJoin('account.webAuthnCredentials', 'webAuthnCredentials', 'webAuthnCredentials.credentialId = :credentialId', { credentialId: dto.authenticationResponse?.id })
            .leftJoin('account.user', 'user')
            .select([
                'account.id',
                'account.email',
                'account.firstName',
                'account.lastName',
                'account.verifiedAt',
                'account.twoFaEnabledAt',
                'webAuthnCredentials.id',
                'webAuthnCredentials.credentialId',
                'webAuthnCredentials.publicKey',
                'webAuthnCredentials.transports',
                'webAuthnCredentials.counter',
                'user.id',
            ]).getOne();
        if (!account) throw new BadRequestException('Invalid email');

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.Login, email: account.email },
            select: { id: true, challenge: true }
        });
        if (!passkeyChallenge) throw new ForbiddenException('Login your passkey first');

        // now remove the challenge
        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge);

        const credential = account.webAuthnCredentials[0];

        if (!credential || credential.credentialId !== dto.authenticationResponse?.id) throw new ForbiddenException('Invalid passkey');

        const result = await verifyAuthenticationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: dto.authenticationResponse,
            credential: {
                id: credential.credentialId,
                publicKey: new Uint8Array(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports
            }
        });

        if (!result.verified) throw new ForbiddenException('Invalid passkey');

        // update last used
        credential.lastUsed = new Date();
        await this.getRepository(WebAuthnCredential).save(credential);

        // NOW IT IS CONFIRMED THE USER IS A VALID ONE
        return this.authService.proceedLogin({
            account,
            req,
            method: 'passkey'
        });
    }

    async verifySudoPasskey(authenticationResponse: any, reply: FastifyReply) {
        const currentUser = this.utilitiesService.getCurrentUser();

        const account = await this.getRepository(Account).createQueryBuilder('account')
            .where('account.id = :accountId', { accountId: currentUser.accountId })
            .andWhere('account.verifiedAt IS NOT NULL')
            .leftJoin('account.webAuthnCredentials', 'webAuthnCredentials', 'webAuthnCredentials.credentialId = :credentialId', { credentialId: authenticationResponse?.id })
            .select([
                'account.id',
                'webAuthnCredentials.id',
                'webAuthnCredentials.credentialId',
                'webAuthnCredentials.publicKey',
                'webAuthnCredentials.transports',
                'webAuthnCredentials.counter',
            ]).getOne();
        if (!account) throw new BadRequestException('Invalid email');

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.Sudo, email: account.email },
            select: { id: true, challenge: true }
        });
        if (!passkeyChallenge) return { verified: false };

        // now remove the challenge
        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge);

        const credential = account.webAuthnCredentials[0];

        if (!credential) throw new ForbiddenException('You have not registered a passkey');
        if (credential.credentialId !== authenticationResponse?.id) return { verified: false };

        const result = await verifyAuthenticationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: authenticationResponse,
            credential: {
                id: credential.credentialId,
                publicKey: new Uint8Array(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports
            }
        });

        if (!result.verified) return { verified: false };

        // update last used
        credential.lastUsed = new Date();
        await this.getRepository(WebAuthnCredential).save(credential);

        const sudoAccessToken = await this.jwtService.getSudoAccessToken(account.id);

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

    async verify2faPasskey(dto: AuthVerifyDto, req: FastifyRequest) {
        const account = await this.getRepository(Account).createQueryBuilder('account')
            .where('account.email = :email', { email: dto.email })
            .andWhere('account.verifiedAt IS NOT NULL')
            .leftJoin('account.webAuthnCredentials', 'webAuthnCredentials', 'webAuthnCredentials.credentialId = :credentialId', { credentialId: dto.authenticationResponse?.id })
            .select([
                'account.id',
                'account.email',
                'account.firstName',
                'account.lastName',
                'account.verifiedAt',
                'account.twoFaEnabledAt',
                'webAuthnCredentials.id',
                'webAuthnCredentials.credentialId',
                'webAuthnCredentials.publicKey',
                'webAuthnCredentials.transports',
                'webAuthnCredentials.counter',
            ]).getOne();
        if (!account) throw new BadRequestException('Invalid email');

        const passkeyChallenge = await this.getRepository(PasskeyChallenge).findOne({
            where: { type: EPasskeyChallengeType.TwoFaVerify, email: account.email },
            select: { id: true, challenge: true }
        });
        if (!passkeyChallenge) throw new ForbiddenException('Invalid Operation');

        // now remove the challenge
        await this.getRepository(PasskeyChallenge).remove(passkeyChallenge);

        const credential = account.webAuthnCredentials[0];

        if (!credential || credential.credentialId !== dto.authenticationResponse?.id) throw new ForbiddenException('Invalid passkey');

        const result = await verifyAuthenticationResponse({
            expectedChallenge: passkeyChallenge.challenge,
            expectedOrigin: this.envService.CLIENT_URL,
            expectedRPID: this.envService.CLIENT_DOMAIN,
            response: dto.authenticationResponse,
            credential: {
                id: credential.credentialId,
                publicKey: new Uint8Array(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports
            }
        });

        if (!result.verified) throw new ForbiddenException('Invalid passkey');

        // update last used
        credential.lastUsed = new Date();
        await this.getRepository(WebAuthnCredential).save(credential);

        // create new device
        const deviceId = generateDeviceId(req.headers['user-agent'], req.ip);

        const existing = await this.getRepository(LoginDevice).findOne({ // there can be the same device but untrusted, so if yes, update that
            where: { account: { id: account.id }, deviceId },
            select: { id: true }
        });

        if (existing?.id) {
            existing.lastLogin = new Date();
            existing.lastActivityRecord = new Date();
            existing.isTrusted = true;

            await this.getRepository(LoginDevice).save(existing);
        } else {
            await this.getRepository(LoginDevice).save({
                id: existing?.id,
                account,
                deviceId,
                firstLogin: new Date(),
                lastLogin: new Date(),
                lastActivityRecord: new Date(),
                ua: req.headers['user-agent'],
                isTrusted: true
            });
        }

        // NOW IT IS CONFIRMED THE USER IS A VALID ONE and no need to check device
        return this.authService.proceedLogin({ account, req, checkDevice: false, method: 'passkey' });
    }

    async findAll() {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const credentials = await this.getRepository(WebAuthnCredential).find({
            where: { account: { id: accountId } },
            select: { id: true, name: true, createdAt: true, lastUsed: true }
        });

        return credentials;
    }

    async updateName(id: string, name: string) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        const credential = await this.getRepository(WebAuthnCredential).findOne({
            where: { id, account: { id: accountId } },
            select: { id: true, name: true }
        });

        if (!credential) throw new NotFoundException('Credential not found');

        // check if name is taken
        const existingWithSameName = await this.getRepository(WebAuthnCredential).findOne({
            where: { id: Not(credential.id), name, account: { id: accountId } },
            select: { id: true }
        });

        if (existingWithSameName) throw new BadRequestException({
            message: 'You already have a credential with this name',
            field: 'name',
        });

        await this.getRepository(WebAuthnCredential).update({ id }, { name });

        return { message: 'Name updated' }
    }

    async delete(id: string) {
        const { accountId } = this.utilitiesService.getCurrentUser();

        await this.getRepository(WebAuthnCredential).delete({ id, account: { id: accountId } });

        return { message: 'Passkey removed' }
    }
}

function incrementPasskey(passkey: string) {
    // Match the part of the string ending with a number
    const match = passkey.match(/(.*?)(\d+)?$/);
    if (!match) return passkey;
    const prefix = match[1].trim(); // The text part, trimmed for safety
    const number = match[2] ? parseInt(match[2], 10) : 0; // Default to 0 if no number found
    return `${prefix} ${number + 1}`; // Increment and reconstruct
}