import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { MinioService } from '../minio/minio.service';
import { generateSlug } from 'src/utils';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly minioService: MinioService
  ) { }

  async create(createProjectDto: CreateProjectDto) {
    // TODO: check if replId already exists

    await this.minioService.copyMinioFolder(`base/${createProjectDto.language}`, `projects/${createProjectDto.replId}`);

    return { message: "Project created", slug: generateSlug(createProjectDto.replId) };
  }

  findAll() {
    return `This action returns all projects`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
