import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ResourceStartDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { OrchestratorService } from './orchestrator.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsQueryDto, ProjectTokenQueryDto } from './dto/projects-query.dto';

@ApiBearerAuth()
@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly orchestratorService: OrchestratorService
  ) { }

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.create(createProjectDto, currentUser);
  }

  @Post('start')
  startResource(@Query() resourceStartDto: ResourceStartDto, @CurrentUser() currentUser: AuthUser) {
    return this.orchestratorService.startResource(resourceStartDto, currentUser);
  }

  @Get()
  findAll(@Query() queryDto: ProjectsQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.findAll(queryDto, currentUser);
  }

  @Get('token')
  getAccessTokenWithProjectPermission(@Query() queryDto: ProjectTokenQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.getAccessTokenWithProjectPermission(queryDto.replId, currentUser);
  }

  @Get(':replId')
  findOne(@Param('replId') replId: string, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.findOne(replId, currentUser);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.update(id, updateProjectDto, currentUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.projectsService.remove(id, currentUser);
  }
}
