import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { UploadDto } from './dto/upload.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('project')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get('download')
  download(@Res() res: Response) {
    return this.projectService.download(res);
  }

  @Post('upload')
  @FormDataRequest()
  upload(@Body() dto: UploadDto) {
    return this.projectService.upload(dto);
  }
}
