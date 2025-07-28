import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, UseInterceptors } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelInviteDto, CreateInviteDto, SendInvitationDto } from './dto/invite.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/global.types';
import { TransactionInterceptor } from 'src/common/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) { }

  @Post('link')
  @ApiOperation({ summary: 'Create invitation link' })
  @UseInterceptors(TransactionInterceptor)
  createInvitationLink(@Body() createInviteDto: CreateInviteDto, @CurrentUser() currentUser: AuthUser) {
    return this.invitesService.createInvitationLink(createInviteDto, currentUser);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send invitation' })
  @UseInterceptors(TransactionInterceptor)
  sendInvitation(@Body() sendInvitationDto: SendInvitationDto, @CurrentUser() currentUser: AuthUser) {
    return this.invitesService.sendInvitation(sendInvitationDto, currentUser);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation' })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TransactionInterceptor)
  acceptInvite(@Query('token') token: string, @CurrentUser() currentUser: AuthUser) {
    return this.invitesService.acceptInvite(token, currentUser);
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel invitation' })
  @UseInterceptors(TransactionInterceptor)
  cancelInvite(@Query() queryDto: CancelInviteDto, @CurrentUser() currentUser: AuthUser) {
    return this.invitesService.cancelInvite(queryDto.email, currentUser);
  }

  @Get('details')
  @ApiOperation({ summary: 'Get invite details' })
  details(@Query('token') token: string, @CurrentUser() currentUser: AuthUser) {
    return this.invitesService.getDetails(token, currentUser);
  }

}
