import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, FindOptionsSelect } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { User } from './entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { BaseRepository } from '../../common/base.repository';
import { AuthUser } from '../../common/global.types';
import { AccountsService } from '../accounts/accounts.service';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly accountsService: AccountsService,
  ) { super(datasource, req) }

  async findOne(id: string, select?: FindOptionsSelect<User>): Promise<User> {
    const existing = await this.getRepository(User).findOne({
      where: { id },
      select: select ?? { id: true },
    })
    if (!existing) throw new NotFoundException('User not found');

    return existing;
  }

  async myDetails(currentUser: AuthUser) {
    return this.getRepository(Account).createQueryBuilder('account')
      .leftJoin('account.profileImage', 'profileImage')
      .leftJoin('account.branch', 'branch')
      .where('account.id = :id', { id: currentUser.accountId })
      .select([
        'account.id as id',
        'account.email as email',
        'account.firstName as firstName',
        'account.lastName as lastName',
        'account.role as role',
        'profileImage.url as profileImageUrl',
        'branch.name as branchName',
      ])
      .getRawOne();
  }

  async update(updateUserDto: UpdateUserDto, currentUser: AuthUser) {
    await this.accountsService.update(currentUser.accountId, updateUserDto);

    return { message: 'User updated' }
  }
}
