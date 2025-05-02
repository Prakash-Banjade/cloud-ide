import { BadRequestException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Account } from './entities/account.entity';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { RefreshTokenService } from '../auth/helpers/refresh-tokens.service';
import { LoginDevice } from './entities/login-devices.entity';
import { UpdateAccountDto } from './dto/update-account.dto';
import { WebAuthnCredential } from '../webAuthn/entities/webAuthnCredential.entity';
import { BaseRepository } from '../../common/base.repository';
import { UtilitiesService } from 'src/utilities/utilities.service';

@Injectable({ scope: Scope.REQUEST })
export class AccountsService extends BaseRepository {
  constructor(
    dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly utilitiesService: UtilitiesService
  ) { super(dataSource, req) }

  async createAccount() { }

  async update(id: string, dto: UpdateAccountDto) {
    const account = await this.getRepository(Account).findOne({
      where: { id },
      select: { id: true, firstName: true, lastName: true, verifiedAt: true }
    });

    if (!account) throw new NotFoundException('No associated account found');

    await this.getRepository(Account).save(Object.assign(account, dto));
  }

  async getDevices() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const loginDevices = await this.getRepository(LoginDevice).find({
      where: { account: { id: accountId } },
      order: { lastLogin: 'DESC' },
      select: { id: true, deviceId: true, ua: true, firstLogin: true, lastActivityRecord: true },
    });

    this.refreshTokenService.init({});
    const tokens = await this.refreshTokenService.getAll(); // this will return all the refresh tokens of the current user

    return loginDevices
      .map((device: any) => ({
        ...device,
        signedIn: tokens.some((token) => token.deviceId === device.deviceId),
      }));
  }

  async revokeDevice(deviceId: string) {
    const { email, deviceId: currentDeviceId, accountId } = this.utilitiesService.getCurrentUser();

    if (deviceId === currentDeviceId) throw new BadRequestException('Cannot revoke current device');

    const device = await this.getRepository(LoginDevice).findOne({
      where: { deviceId, account: { id: accountId } },
      select: { id: true },
    });

    if (device) {
      await this.getRepository(LoginDevice).save({
        ...device,
        isTrusted: false,
      });
    }

    this.refreshTokenService.init({
      deviceId,
      email: email
    });
    await this.refreshTokenService.remove();

    // remove credentials
    await this.getRepository(WebAuthnCredential).delete({ account: { id: accountId } });

    return { message: 'Device signed out' };
  }

  async get2FaStatus() {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const account = await this.getRepository(Account).findOne({
      where: { id: accountId },
      select: { id: true, twoFaEnabledAt: true }
    });

    if (!account) throw new NotFoundException('No associated account found');

    return {
      twoFaEnabledAt: account.twoFaEnabledAt
    }
  }

  async toggle2Fa(enable2Fa: boolean) {
    const { accountId } = this.utilitiesService.getCurrentUser();

    const account = await this.getRepository(Account).findOne({
      where: { id: accountId },
      select: { id: true, verifiedAt: true, twoFaEnabledAt: true }
    });

    if (!account) throw new NotFoundException('No associated account found');

    account.twoFaEnabledAt = enable2Fa ? new Date() : null;

    await this.getRepository(Account).save(account);

    return;
  }
}
