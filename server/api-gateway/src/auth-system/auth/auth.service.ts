import { BadRequestException, ConflictException, ForbiddenException, HttpStatus, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope, UnauthorizedException } from '@nestjs/common';
import { DataSource, IsNull, Not } from 'typeorm';
import { PasswordChangeRequest } from './entities/password-change-request.entity';
import { REQUEST } from '@nestjs/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Account } from '../accounts/entities/account.entity';
import { RegisterDto, SignInDto } from './dto/signIn.dto';
import { AuthHelper } from './helpers/auth.helper';
import { JwtService } from '../jwt/jwt.service';
import { CookieSerializeOptions } from '@fastify/cookie';
import * as bcrypt from "bcryptjs";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenExpiredError } from '@nestjs/jwt';
import { IVerifyEncryptedHashTokenPairReturn } from './helpers/interface';
import { RefreshTokenService } from './helpers/refresh-tokens.service';
import { EnvService } from 'src/env/env.service';
import { LoginDevice } from '../accounts/entities/login-devices.entity';
import { WebAuthnCredential } from '../webAuthn/entities/webAuthnCredential.entity';
import { EOptVerificationType, OtpVerificationPending } from './entities/otp-verification-pending.entity';
import { ChangePasswordDto, OtpVerificationDto, ResetPasswordDto, UpdateEmailDto } from './dto/auth.dtos';
import { BaseRepository } from '../../common/base.repository';
import { AuthMessage, MAX_PREV_PASSWORDS, PASSWORD_SALT_COUNT, Tokens } from '../../common/CONSTANTS';
import { generateDeviceId } from '../../common/utils';
import { AuthUser } from '../../common/global.types';
import { User } from '../users/entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class AuthService extends BaseRepository {

  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly authHelper: AuthHelper,
    private readonly eventEmitter: EventEmitter2,
    private readonly refreshTokenService: RefreshTokenService,
  ) { super(datasource, req) }

  async login(signInDto: SignInDto, req: FastifyRequest, reply: FastifyReply) {
    const data = await this.authHelper.validateAccount(signInDto.email, signInDto.password);

    if (!(data instanceof Account)) return data; // this can be a message after sending mail to unverified user

    const foundAccount = data;

    return this.proceedLogin({ account: foundAccount, req, reply });
  }

  async proceedLogin({
    account, req, reply, checkDevice = true, method = 'password'
  }: {
    account: Account, req: FastifyRequest, reply: FastifyReply, checkDevice?: boolean, method?: 'password' | 'passkey'
  }) {
    if (checkDevice) {
      const message = await this.handleDevice(account, req, method); // refreshtoken instance initialized here
      if (message && 'message' in message) return message; // this can be first time login message
    }

    const existingRefreshCookie = req.cookies?.[Tokens.REFRESH_TOKEN_COOKIE_NAME];

    const { access_token, refresh_token } = await this.jwtService.getAuthTokens(account, req);

    // remove old refresh token from cookie
    if (existingRefreshCookie) {
      const { value: existingRefreshToken, valid } = req.unsignCookie(existingRefreshCookie);
      if (existingRefreshToken && valid) reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, this.getRefreshCookieOptions()); // CLEAR COOKIE, BCZ A NEW ONE IS TO BE GENERATED
    }

    await this.refreshTokenService.set(refresh_token); // set the new refresh_token to the redis cache

    return reply
      .setCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, refresh_token, this.getRefreshCookieOptions())
      .header('Content-Type', 'application/json')
      .send({
        access_token,
        user: {
          firstName: account.firstName,
          lastName: account.lastName,
        }
      })
  }

  async handleDevice(account: Account, req: FastifyRequest, method: 'password' | 'passkey' = 'password') {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const deviceId = generateDeviceId(userAgent, ipAddress);
    const now = new Date();

    const loginDevice = await this.getRepository(LoginDevice).findOne({
      where: {
        deviceId,
        account: { id: account.id },
        isTrusted: true,
      },
      select: { id: true },
    });

    if (!loginDevice) {
      if (!!account.twoFaEnabledAt && method === 'password') {  // 2fa is enabled, so require 2fa verification else add the device to db
        const webAuthn = await this.getRepository(WebAuthnCredential).findOne({
          where: { account: { id: account.id } },
          select: { id: true }
        });

        return ({
          message: AuthMessage.DEVICE_NOT_FOUND,
          hasPasskey: !!webAuthn,
        })
      }

      await this.getRepository(LoginDevice).save({
        account,
        deviceId,
        firstLogin: now,
        lastActivityRecord: now,
        lastLogin: now,
        ua: userAgent,
        isTrusted: true
      });

    } else {
      loginDevice.lastLogin = now;
      loginDevice.lastActivityRecord = now;
      await this.getRepository(LoginDevice).save(loginDevice);
    }

    this.refreshTokenService.init({ email: account.email, deviceId }); // initialize the refresh token instance from here to provide the email and device
  }

  getRefreshCookieOptions(): CookieSerializeOptions {
    return {
      secure: this.envService.NODE_ENV === 'production',
      httpOnly: true,
      priority: 'high',
      signed: true,
      sameSite: this.envService.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(Date.now() + (this.envService.REFRESH_TOKEN_EXPIRATION_SEC * 1000)),
      path: '/', // necessary to be able to access cookie from out of this route path context, like auth.guard.ts
    }
  }

  async register(dto: RegisterDto) {
    const existingWithSameEmail = await this.getRepository(Account).findOne({ where: { email: dto.email }, select: { id: true } });
    if (existingWithSameEmail) throw new ConflictException({ message: 'Duplicate email. This email is already in use', field: 'email' });

    const pwdHash = await bcrypt.hash(dto.password, PASSWORD_SALT_COUNT);

    const account = this.getRepository(Account).create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: pwdHash,
      prevPasswords: [pwdHash],
      user: this.getRepository(User).create({})
    });

    await this.getRepository(Account).save(account);

    return this.authHelper.sendEmailConfirmation({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
    } as Account);
  }

  async verifyEmail(otpVerificationDto: OtpVerificationDto, req: FastifyRequest) {
    const foundRequest = await this.authHelper.verifyPendingOtp({
      otpVerificationDto,
      type: EOptVerificationType.EMAIL_VERIFICATION,
    });

    // GET ACCOUNT FROM DATABASE
    const foundAccount = await this.getRepository(Account).findOne({
      where: { email: foundRequest.email },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    if (!foundAccount) throw new NotFoundException('Account not found');


    foundAccount.verifiedAt = new Date();
    await this.getRepository(Account).save(foundAccount);

    await this.getRepository(OtpVerificationPending).remove(foundRequest); // remove from db

    // add login device
    await this.getRepository(LoginDevice).save({
      account: foundAccount,
      deviceId: generateDeviceId(req.headers['user-agent'], req.ip),
      firstLogin: new Date(),
      lastLogin: new Date(),
      lastActivityRecord: new Date(),
      ua: req.headers['user-agent'],
      isTrusted: true
    });

    return { message: 'Account verified successfully' };
  }

  async verifyEmailResetToken(verificationToken: string) {
    const result = await this.authHelper.verifyEncryptedHashTokenPair<{ email: string }>(verificationToken, this.envService.EMAIL_VERIFICATION_SECRET);
    if (result?.error || !result?.payload?.email) {
      if (result.error instanceof TokenExpiredError) throw new BadRequestException('OTP has been expired');
      throw new BadRequestException(result.error?.message || 'Invalid token');
    };

    return { message: "VALID TOKEN" };
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const cookie = req.cookies?.[Tokens.REFRESH_TOKEN_COOKIE_NAME];
    if (!cookie) throw new UnauthorizedException('Missing refresh token');

    const { value: existingCookie, valid } = req.unsignCookie(cookie);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, this.getRefreshCookieOptions()); // a new refresh token is to be generated

    const account = await this.getRepository(Account).findOne({
      where: { id: req.accountId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    }); // accountId is validated in the refresh token guard
    if (!account) throw new UnauthorizedException('Invalid refresh token');

    const deviceId = generateDeviceId(req.headers['user-agent'], req.ip);
    this.refreshTokenService.init({ email: account.email, deviceId });

    // check if refreshtoken exists
    const rtPayload = await this.refreshTokenService.get(); // refreshToken Payload
    if (!rtPayload || (rtPayload && rtPayload.refreshToken !== existingCookie)) throw new UnauthorizedException('Invalid refresh token');

    // update the last activity record of the device
    const device = await this.getRepository(LoginDevice).findOne({
      where: { deviceId, account: { id: account.id } },
      select: { id: true },
    });
    if (!device) throw new UnauthorizedException('Unrecognized device'); // TODO: better to send mail to the user about unrecognized login or take some other action

    await this.getRepository(LoginDevice).update(device.id, { lastActivityRecord: new Date() });

    // set new refresh_token
    const { access_token, refresh_token } = await this.jwtService.getAuthTokens(account, req);
    await this.refreshTokenService.set(refresh_token); // set the new refresh_token to the redis cache for the current device

    return reply
      .setCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, refresh_token, this.getRefreshCookieOptions())
      .header('Content-Type', 'application/json')
      .send({
        access_token,
        user: {
          firstName: account.firstName,
          lastName: account.lastName,
        }
      })
  }

  async logout(reply: FastifyReply) {
    this.refreshTokenService.init({});
    this.refreshTokenService.remove(); // remove the current token from redis cache

    return reply.clearCookie(Tokens.REFRESH_TOKEN_COOKIE_NAME, this.getRefreshCookieOptions()).status(HttpStatus.NO_CONTENT).send();
  }

  async changePassword(changePasswordDto: ChangePasswordDto, currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOne({
      where: { id: currentUser.accountId, verifiedAt: Not(IsNull()) },
      select: { id: true, password: true, prevPasswords: true, passwordUpdatedAt: true, verifiedAt: true }
    });
    if (!account?.password) throw new InternalServerErrorException('Associated account not found');

    // check if the current password is correct
    const isPasswordMatch = await bcrypt.compare(changePasswordDto.currentPassword, account.password);
    if (!isPasswordMatch) throw new BadRequestException({
      message: 'Invalid password',
      field: 'currentPassword'
    });

    // check if the new password is one of the last MAX_PREV_PASSWORDS passwords
    for (const prevPassword of account.prevPasswords) {
      const isMatch = await bcrypt.compare(changePasswordDto.newPassword, prevPassword);
      if (isMatch) throw new ForbiddenException({
        message: `New password cannot be one of the last ${MAX_PREV_PASSWORDS} passwords`,
        field: 'newPassword'
      });
    }

    const hashedPwd = bcrypt.hashSync(changePasswordDto.newPassword, PASSWORD_SALT_COUNT);

    account.password = hashedPwd;
    account.prevPasswords.push(hashedPwd);
    account.passwordUpdatedAt = new Date();

    // maintain prev passwords of size MAX_PREV_PASSWORDS
    if (account.prevPasswords?.length > MAX_PREV_PASSWORDS) {
      account.prevPasswords.shift(); // remove the oldest one, index [0]
    }

    await this.getRepository(Account).update({ id: account.id }, account);

    if (changePasswordDto.logout) {
      this.refreshTokenService.init({});
      await this.refreshTokenService.removeAll();
    }

    return { message: "Password changed" }
  }

  async forgotPassword(email: string) {
    const foundAccount = await this.getRepository(Account).findOne({
      where: { email, verifiedAt: Not(IsNull()) },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!foundAccount) throw new NotFoundException({
      message: "Invalid email. No account exist.",
      field: "email"
    });

    const [resetToken, hashedResetToken] = await this.authHelper.getEncryptedHashTokenPair(
      { email: foundAccount.email },
      this.envService.FORGOT_PASSWORD_SECRET,
      this.envService.FORGOT_PASSWORD_EXPIRATION_SEC
    )

    // existing request
    let changeRequest: PasswordChangeRequest;
    const existingRequest = await this.getRepository(PasswordChangeRequest).findOne({ where: { email }, select: { id: true } });
    if (existingRequest) {
      existingRequest.hashedResetToken = hashedResetToken;
      changeRequest = existingRequest;
    } else {
      const passwordChangeRequest = this.getRepository(PasswordChangeRequest).create({
        email: foundAccount.email,
        hashedResetToken,
      });
      changeRequest = passwordChangeRequest;
    }

    await this.getRepository(PasswordChangeRequest).save(changeRequest);

    // TODO: send reset password link mail
    // this.eventEmitter.emit(MailEvents.RESET_PASSWORD, new ResetPasswordMailEventDto({
    //   receiverEmail: foundAccount.email,
    //   receiverName: `${foundAccount.firstName} ${foundAccount.lastName}`,
    //   token: resetToken
    // }));

    return {
      message: `Link is valid for ${this.envService.FORGOT_PASSWORD_EXPIRATION_SEC / 60} minutes`,
    };
  }

  /**
   * This service is also used in a controller, so frontend can verify the token before allowing for the reset password request
   */
  async verifyResetToken(providedResetToken: string, data = false) {
    // hash the provided token to check in database
    const result = await this.authHelper.verifyEncryptedHashTokenPair<{ email: string }>(providedResetToken, this.envService.FORGOT_PASSWORD_SECRET);
    if (result?.error || !result?.payload?.email) {
      // Todo: if token is not valid, remove the password change request from the database
      if (result.error instanceof TokenExpiredError) throw new BadRequestException('Link has been expired');
      throw new BadRequestException(result.error?.message || 'Invalid reset token');
    };

    return data ? result : { message: "VALID TOKEN" };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token: providedResetToken, password } = resetPasswordDto;

    const result = (await this.verifyResetToken(providedResetToken, true)) as IVerifyEncryptedHashTokenPairReturn<{ email: string }>;
    const { payload, tokenHash } = result;

    if (!payload || !tokenHash) throw new BadRequestException('Invalid reset token');

    // Retrieve the hashed reset token from the database
    const passwordChangeRequest = await this.getRepository(PasswordChangeRequest).findOneBy({ hashedResetToken: tokenHash, email: payload.email });

    if (!passwordChangeRequest) throw new NotFoundException('Invalid request');

    // Check if the reset token has expired # JWT WILL VERIFY THE EXPIRATION

    // retrieve the user from the database
    const account = await this.getRepository(Account).findOne({
      where: { email: passwordChangeRequest.email },
      select: { id: true, email: true, prevPasswords: true, verifiedAt: true }
    });
    if (!account) throw new InternalServerErrorException('The requested Account was not available in the database.');

    // check if the new password is one of the last MAX_PREV_PASSWORDS passwords
    for (const prevPassword of account.prevPasswords) {
      const isMatch = await bcrypt.compare(password, prevPassword);
      if (isMatch) throw new ForbiddenException(`New password cannot be one of the last ${MAX_PREV_PASSWORDS} passwords`)
    }

    const hashedPwd = bcrypt.hashSync(password, PASSWORD_SALT_COUNT);

    account.password = hashedPwd;
    account.prevPasswords.push(hashedPwd);
    account.passwordUpdatedAt = new Date();

    // maintain prev passwords of size MAX_PREV_PASSWORDS
    if (account.prevPasswords?.length > MAX_PREV_PASSWORDS) {
      account.prevPasswords.shift(); // remove the oldest one, index [0]
    }

    await this.getRepository(Account).save(account);

    // clear the reset token from the database
    await this.getRepository(PasswordChangeRequest).remove(passwordChangeRequest);

    // logout of all devices
    this.refreshTokenService.init({ email: account.email });
    await this.refreshTokenService.removeAll();

    // Return success response
    return { message: 'Password reset successful' };
  }
  
  async updateEmail(updateEmailDto: UpdateEmailDto, currentUser: AuthUser) {
    const account = await this.getRepository(Account).findOne({
      where: { id: currentUser.accountId },
      select: { id: true, password: true, verifiedAt: true }
    });
    if (!account?.password) throw new InternalServerErrorException('Unable to update the associated profile. Please contact support.');

    const isPasswordMatch = await bcrypt.compare(updateEmailDto.password, account.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Invalid password');

    account.email = updateEmailDto.newEmail;

    await this.getRepository(Account).save(account);

    return { message: 'Email updated' }
  }
}
