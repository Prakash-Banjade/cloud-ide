import { Controller, Get, Body, Patch, Param, Delete, Query, UseInterceptors, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/user-query.dto';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { TransactionInterceptor } from '../../common/transaction.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/global.types';

@ApiExcludeController()
@ApiTags("Users")
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() queryDto: UsersQueryDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('me')
  getMyInfo(@CurrentUser() currentUser: AuthUser) {
    return this.usersService.myDetails(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch()
  @UseInterceptors(TransactionInterceptor)
  update(@Body() updateUserDto: UpdateUserDto, @CurrentUser() currentUser: AuthUser) {
    return this.usersService.update(updateUserDto, currentUser);
  }
}
