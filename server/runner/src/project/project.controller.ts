import { Body, Controller, Get, Post, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { UploadDto } from './dto/upload.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('project')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get('download')
  download(@Res() res: Response) {
    return this.projectService.download(res);
  }

  @Post('upload')
  @UseInterceptors(AnyFilesInterceptor())
  upload(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.projectService.upload(files);
  }
}
