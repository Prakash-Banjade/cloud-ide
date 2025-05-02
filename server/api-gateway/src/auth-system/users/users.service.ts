import { Inject, Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Brackets, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { UsersQueryDto } from './dto/user-query.dto';
import { User } from './entities/user.entity';
import { userSelectCols } from './helpers/user-select-cols';
import { Account } from '../accounts/entities/account.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AccountsService } from '../accounts/accounts.service';
import { BaseRepository } from '../../common/base.repository';
import { AuthUser } from '../../common/global.types';
import { paginatedRawData } from '../../common/utilities/paginated-data';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BaseRepository {
  constructor(
    datasource: DataSource, @Inject(REQUEST) req: FastifyRequest,
    private readonly accountsService: AccountsService,
  ) { super(datasource, req) }

  async create(createUserDto: CreateUserDto) { }

  async findAll(queryDto: UsersQueryDto) {
    const queryBuilder = this.getRepository(User).createQueryBuilder('user');

    queryBuilder
      .orderBy("user.createdAt", queryDto.order)
      .offset(queryDto.skip)
      .limit(queryDto.take)
      .leftJoin("user.account", "account")
      .leftJoin("account.branch", "branch")
      .leftJoin("account.profileImage", "profileImage")
      .select([
        "user.id as id",
        "profileImage.url as profileImageUrl",
        "CONCAT(account.firstName, ' ', account.lastName) as fullName",
        "account.email as email",
        "account.role as role",
        "branch.name as branchName",
      ])

    return paginatedRawData(queryDto, queryBuilder);
  }

  async findOne(id: string): Promise<User> {
    const existing = await this.getRepository(User).findOne({
      where: { id },
      relations: {
        account: true,
      },
      select: userSelectCols,
    })
    if (!existing) throw new NotFoundException('User not found');

    return existing;
  }

  async getUserByAccountId(accountId: string): Promise<User> {
    const user = await this.getRepository(User).findOne({
      where: {
        account: { id: accountId }
      },
      relations: {
        account: true
      },
      select: userSelectCols,
    })
    if (!user) throw new NotFoundException('User not found')

    return user;
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
    const existingUser = await this.getUserByAccountId(currentUser.accountId);
    const existingAccount = await this.getRepository(Account).findOne({
      where: { id: currentUser.accountId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verifiedAt: true
      }
    });
    if (!existingAccount) throw new InternalServerErrorException('Unable to update the associated profile. Please contact support.');

    // update user
    Object.assign(existingUser, {
      ...updateUserDto,
    });

    await this.getRepository(User).save(existingUser);

    Object.assign(existingAccount, {
      firstName: updateUserDto.firstName || existingAccount.firstName,
      lastName: updateUserDto.lastName || existingAccount.lastName,
    })

    await this.getRepository(Account).save(existingAccount);

    return { message: 'Profile Updated' }
  }
}
