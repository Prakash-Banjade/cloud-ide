import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invite } from './entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AuthUser } from 'src/common/global.types';
import { Project } from 'src/projects/entities/project.entity';
import { InvitesHelperService } from './invites-helper.service';
import { TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class InvitesService {
    constructor(
        @InjectRepository(Invite) private readonly invitesRepo: Repository<Invite>,
        @InjectRepository(Project) private readonly projectsRepo: Repository<Project>,
        private readonly invitesHelperService: InvitesHelperService
    ) { }

    async create(dto: CreateInviteDto, currentUser: AuthUser) {
        const project = await this.projectsRepo.findOne({
            where: {
                id: dto.projectId,
                createdBy: { id: currentUser.userId }
            },
            select: { id: true }
        });

        if (!project) throw new ForbiddenException('Access denied.');

        const { invitationLink, tokenHash } = this.invitesHelperService.generateLink(project.id);

        const invite = this.invitesRepo.create({
            project,
            tokenHash,
        });

        await this.invitesRepo.save(invite);

        return { invitationLink };
    }

    async validate(token: string) {
        const { error, payload, tokenHash } = this.invitesHelperService.validateToken(token);

        if (error || !payload?.projectId || !tokenHash) {
            if (error instanceof TokenExpiredError) throw new BadRequestException('Link has been expired');
            throw new BadRequestException(error?.message || 'Invalid reset token');
        };

        const invite = await this.invitesRepo.findOne({
            where: {
                tokenHash,
                project: { id: payload.projectId }
            },
            select: { id: true }
        });

        if (!invite) throw new NotFoundException('Invalid invitation');

        return true;
    }
}
