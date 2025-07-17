import { Controller, Get, Post, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 100;

@Controller('project')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @Get('download')
  download(@Res() res: Response) {
    return this.projectService.download(res);
  }

  @Post('upload')
  @UseInterceptors(AnyFilesInterceptor({
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: MAX_FILES,
    },
  }))
  upload(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.projectService.upload(files);
  }
}
