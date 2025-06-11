import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('project')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get('download')
  download(@Res() res: Response) {
    return this.projectService.download(res);
  }
}
