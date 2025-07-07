import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsQueryDto, UpdateCollaboratorDto } from './dto/collaborator.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Collaborators')
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) { }

  @Get()
  findAll(@Query() queryDto: CollaboratorsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.collaboratorsService.findAll(queryDto, currentUser);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollaboratorDto, @CurrentUser() currentUser: AuthUser) {
    return this.collaboratorsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collaboratorsService.remove(id);
  }
}
