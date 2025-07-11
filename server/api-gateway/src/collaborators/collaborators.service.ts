import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Collaborator } from './entities/collaborator.entity';
import { Repository } from 'typeorm';
import { CollaboratorsQueryDto, UpdateCollaboratorDto } from './dto/collaborator.dto';
import { AuthUser } from 'src/common/global.types';

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectRepository(Collaborator) private readonly collaboratorsRepo: Repository<Collaborator>,
  ) { }

  findAll(queryDto: CollaboratorsQueryDto, currentUser: AuthUser) {
    return this.collaboratorsRepo.createQueryBuilder('collab')
      .orderBy('collab.createdAt', 'DESC')
      .leftJoin('collab.project', 'project')
      .leftJoin('collab.user', 'user')
      .leftJoin('user.account', 'account')
      .where('project.replId = :projectId', { projectId: queryDto.replId })
      .andWhere('project.createdById = :createdById', { createdById: currentUser.userId })
      .select([
        'collab.id',
        'collab.permission',
        'collab.status',
        'collab.email',
        'user.id',
        'account.id',
        'account.firstName',
        'account.lastName',
      ])
      .getMany();
  }

  async findOne(id: string, currentUser: AuthUser) {
    const collaborator = await this.collaboratorsRepo.findOne({
      where: {
        id,
        project: {
          createdBy: { id: currentUser.userId }
        }
      },
      select: { id: true }
    });

    if (!collaborator) throw new NotFoundException('Collaborator not found');

    return collaborator;
  }

  async update(id: string, dto: UpdateCollaboratorDto, currentUser: AuthUser) {
    const collaborator = await this.findOne(id, currentUser);

    collaborator.permission = dto.permission;

    await this.collaboratorsRepo.save(collaborator);

    return { message: 'Permission updated' };
  }

  async remove(id: string) {
    await this.collaboratorsRepo.delete({ id });

    return { message: 'Collaborator removed' };
  }
}
