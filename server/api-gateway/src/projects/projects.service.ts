import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { MinioService } from '../minio/minio.service';
import { generateSlug } from 'src/common/utils';
import { AuthUser } from 'src/common/global.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/auth-system/users/users.service';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import paginatedData from 'src/common/utilities/paginated-data';
import { OrchestratorService } from './orchestrator.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    private readonly minioService: MinioService,
    private readonly usersService: UsersService,
    private readonly orchestratorService: OrchestratorService
  ) { }

  async create(createProjectDto: CreateProjectDto, currentUser: AuthUser) {
    // const replId = await this.getReplId(createProjectDto.projectName);
    const replId = "node-node";

    const user = await this.usersService.findOne(currentUser.userId);

    await this.minioService.copyMinioFolder(`base/${createProjectDto.language}`, `code/${replId}`);

    const newProject = this.projectRepo.create({
      name: createProjectDto.projectName,
      originalName: createProjectDto.projectName,
      language: createProjectDto.language,
      replId,
      createdBy: user,
    });

    await this.projectRepo.save(newProject);

    return { message: "Project created", replId }; // replId is used in frontend to redirect user
  }

  async getReplId(projectName: string): Promise<string> {
    const replId = generateSlug(projectName, true);

    const existingProject = await this.projectRepo.findOne({ where: { replId }, select: { id: true } });

    if (existingProject) return await this.getReplId(projectName);

    return replId;
  }

  findAll(queryDto: ProjectsQueryDto, currentUser: AuthUser) {
    const querybuilder = this.projectRepo.createQueryBuilder('project')
      .orderBy(queryDto.sortBy, queryDto.sortBy.includes('name') ? 'ASC' : queryDto.order) // sort by ASC for name
      .where('project.createdById = :userId', { userId: currentUser.userId });

    if (queryDto.q) {
      querybuilder.andWhere('project.name ILIKE :q', { q: `%${queryDto.q}%` });
    }

    if (queryDto.language) {
      querybuilder.andWhere('project.language = :language', { language: queryDto.language });
    }

    querybuilder.select([
      'project.id',
      'project.name',
      'project.language',
      'project.createdAt',
      'project.replId',
      'project.updatedAt',
    ]);

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string, currentUser: AuthUser) {
    const project = await this.projectRepo.createQueryBuilder('project')
      .where('project.replId = :id', { id })
      .andWhere('project.createdById = :userId', { userId: currentUser.userId })
      .loadRelationCountAndMap('project.collaboratorsCount', 'project.collaborators')
      .select([
        'project.id',
        'project.name',
        'project.language',
        'project.replId',
      ]).getOne();

    if (!project) throw new NotFoundException('Project not found');

    // update last opened
    project.updatedAt = new Date().toISOString();
    this.projectRepo.save(project);

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, currentUser: AuthUser) {
    await this.projectRepo.update({
      id,
      createdBy: { id: currentUser.userId }
    }, {
      name: dto.projectName
    });

    return { message: "Project updated" };
  }

  async remove(id: string, currentUser: AuthUser) {
    const existingProject = await this.projectRepo.findOne({ where: { id, createdBy: { id: currentUser.userId } }, select: { id: true, replId: true } });

    if (!existingProject) throw new NotFoundException('Project not found');

    await this.orchestratorService.removeResources(existingProject.replId); // remove k8s resources

    await this.minioService.removePrefix(`code/${existingProject.replId}`); // remove from Minio

    await this.projectRepo.delete({
      id,
      createdBy: { id: currentUser.userId }
    });

    return { message: "Project deleted" };
  }
}
