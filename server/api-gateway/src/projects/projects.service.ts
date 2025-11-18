import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { MinioService } from '../minio/minio.service';
import { generateSlug } from 'src/common/utils';
import { AuthUser } from 'src/common/global.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Brackets, Repository } from 'typeorm';
import { UsersService } from 'src/auth-system/users/users.service';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import paginatedData from 'src/common/utilities/paginated-data';
import { OrchestratorService } from './orchestrator.service';
import { JwtService } from 'src/auth-system/jwt/jwt.service';
import { EPermission } from 'src/collaborators/entities/collaborator.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    private readonly minioService: MinioService,
    private readonly usersService: UsersService,
    private readonly orchestratorService: OrchestratorService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async create(createProjectDto: CreateProjectDto, currentUser: AuthUser) {
    const replId = this.configService.get("NODE_ENV") === "production"
      ? await this.getReplId(createProjectDto.projectName)
      : "node-node";

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
      .leftJoin('project.createdBy', 'createdBy')
      .loadRelationCountAndMap('project.collaboratorsCount', 'project.collaborators');

    if (queryDto.collab) {
      querybuilder
        .leftJoin('project.collaborators', 'collaborators')
        .where('collaborators.userId = :userId', { userId: currentUser.userId })
        .andWhere('collaborators.permission != :permission', { permission: EPermission.NONE });
    } else {
      querybuilder.where('createdBy.id = :userId', { userId: currentUser.userId });
    }

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
      'createdBy.id',
    ]);

    if (queryDto.collab) {
      querybuilder.addSelect([
        'collaborators.id',
        'collaborators.permission'
      ])
    }

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string, currentUser: AuthUser) {
    const project = await this.projectRepo.createQueryBuilder('project')
      .leftJoin('project.collaborators', 'collaborators')
      .leftJoin('project.createdBy', 'createdBy')
      .where('project.replId = :id', { id })
      .andWhere(new Brackets(qb => {
        qb.orWhere('createdBy.id = :userId', { userId: currentUser.userId })
          .orWhere('(collaborators.userId = :userId AND collaborators.permission != :permission)', { userId: currentUser.userId, permission: EPermission.NONE });
      }))
      .loadRelationCountAndMap('project.collaboratorsCount', 'project.collaborators')
      .select([
        'project.id',
        'project.name',
        'project.language',
        'project.replId',
        'createdBy.id',
        'collaborators.id',
        'collaborators.permission'
      ]).getOne();

    if (!project) throw new NotFoundException('Project not found');

    // update last opened
    this.projectRepo.update({ id: project.id }, { updatedAt: new Date().toISOString() });

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

  async getAccessTokenWithProjectPermission(replId: string, currentUser: AuthUser) {
    const project = await this.projectRepo.findOne({
      where: { replId },
      relations: { createdBy: true, collaborators: { user: true } },
      select: {
        id: true,
        replId: true,
        createdBy: {
          id: true,
        },
        collaborators: {
          id: true,
          permission: true,
          user: {
            id: true,
          }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const isOwner = project.createdBy.id === currentUser.userId;

    const collaborator = project.collaborators.find(collaborator => collaborator.user?.id === currentUser.userId);

    if (!isOwner && (!collaborator || collaborator.permission === EPermission.NONE)) throw new ForbiddenException('Access denied.');

    const access_token = await this.jwtService.getAccessTokenWithProjectPermission({
      permission: isOwner ? EPermission.WRITE : collaborator?.permission,
      userId: currentUser.userId,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email
    });

    return { access_token };
  }
}
