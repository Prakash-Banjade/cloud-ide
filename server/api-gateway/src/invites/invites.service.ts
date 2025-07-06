import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Invite } from './entities/invite.entity';
import { CreateInviteDto, SendInvitationDto } from './dto/invite.dto';
import { AuthUser } from 'src/common/global.types';
import { Project } from 'src/projects/entities/project.entity';
import { InvitesHelperService } from './invites-helper.service';
import { TokenExpiredError } from '@nestjs/jwt';
import { CollaboratorsService } from 'src/collaborators/collaborators.service';
import { BaseRepository } from 'src/common/base.repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Collaborator, ECollaboratorPermission, ECollaboratorStatus } from 'src/collaborators/entities/collaborator.entity';
import { User } from 'src/auth-system/users/entities/user.entity';

@Injectable()
export class InvitesService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly invitesHelperService: InvitesHelperService,
    ) { super(dataSource, req) }

    async createInvitationLink(dto: CreateInviteDto, currentUser: AuthUser) {
        const project = await this.getRepository(Project).findOne({
            where: {
                id: dto.projectId,
                createdBy: { id: currentUser.userId }
            },
            select: { id: true }
        });

        if (!project) throw new ForbiddenException('Access denied.');

        // check for existing invite, if yes, return it
        const existingInvite = await this.getRepository(Invite).findOne({
            where: {
                project: { id: project.id }
            },
            select: { id: true, expiresIn: true, invitationLink: true }
        });

        if (existingInvite && Date.now() < existingInvite.expiresIn) {
            return { invitationLink: existingInvite.invitationLink };
        }

        // else create new invite
        const { invitationLink, tokenHash, expiresIn } = this.invitesHelperService.generateLink(project.id);

        // delete existing invite if any
        await this.getRepository(Invite).delete({ project: { id: project.id }, email: IsNull() });

        const invite = this.getRepository(Invite).create({
            project,
            tokenHash,
            invitationLink,
            expiresIn
        });

        await this.getRepository(Invite).save(invite);

        return { invitationLink };
    }

    async sendInvitation(dto: SendInvitationDto, currentUser: AuthUser) {
        if (dto.email === currentUser.email) throw new BadRequestException('You cannot invite yourself.');

        const project = await this.getRepository(Project).findOne({
            where: {
                id: dto.projectId,
                createdBy: { id: currentUser.userId }
            },
            select: { id: true }
        });

        if (!project) throw new ForbiddenException('Access denied.');

        // check of existing
        const existing = await this.getRepository(Invite).findOne({
            where: {
                project: { id: project.id },
                email: dto.email,
            },
            select: { id: true }
        });

        if (existing) throw new ConflictException("Invite already sent. Cancel existing invite first.");

        const { invitationLink, tokenHash, expiresIn } = this.invitesHelperService.generateLink(project.id);

        // check if user exists with the email
        const user = await this.getRepository(User).findOne({
            where: { account: { email: dto.email } },
            select: { id: true }
        });

        const invite = this.getRepository(Invite).create({
            project,
            email: dto.email,
            tokenHash,
            invitationLink,
            expiresIn
        });

        // create collaborator
        const collaborator = this.getRepository(Collaborator).create({
            project,
            user,
            ...dto,
        });

        await this.getRepository(Collaborator).save(collaborator);

        await this.getRepository(Invite).save(invite);

        console.log(invitationLink);

        // TODO: send email to the invitee

        return { message: 'Invitation sent successfully' };
    }

    async validate(token: string) {
        const { error, payload, tokenHash } = this.invitesHelperService.validateToken(token);

        if (error || !payload?.projectId || !tokenHash) {
            if (error instanceof TokenExpiredError) throw new BadRequestException('Link has been expired');
            throw new BadRequestException(error?.message || 'Invalid reset token');
        };

        const invite = await this.getRepository(Invite).findOne({
            where: {
                tokenHash,
                project: { id: payload.projectId }
            },
            relations: { project: { createdBy: { account: true } } },
            select: {
                id: true,
                email: true,
                project: {
                    id: true,
                    name: true,
                    replId: true,
                    createdBy: {
                        id: true,
                        account: {
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        });

        if (!invite) throw new NotFoundException('Invalid invitation');

        return invite;
    }

    async getDetails(token: string, currentUser: AuthUser) {
        const invite = await this.validate(token);

        if (invite.project.createdBy.id === currentUser.userId) throw new BadRequestException('Cannot accept your own invite.'); // self accepting the invite

        if (invite.email !== currentUser.email) throw new ForbiddenException('Access denied. You aren not allowed to accept this invite.');

        return invite;
    }

    async acceptInvite(token: string, currentUser: AuthUser) {
        const invite = await this.validate(token);
        if (invite.project.createdBy.id === currentUser.userId) throw new BadRequestException('Cannot accept your own invite.'); // self accepting the invite

        const user = await this.getRepository(User).findOne({ // current user -> collaborator
            where: { id: currentUser.userId },
            select: { id: true }
        });

        if (!user) throw new NotFoundException('User not found.');

        const collaborator = await this.getRepository(Collaborator).findOne({ // current user -> collaborator
            where: { user: { id: user.id }, project: { id: invite.project.id } },
            select: { id: true }
        });

        if (collaborator) { // collaborator exist (when invited through mail) -> update
            collaborator.user = user;
            collaborator.permission = ECollaboratorPermission.READ;
            collaborator.status = ECollaboratorStatus.ACCEPTED;
            await this.getRepository(Collaborator).save(collaborator);
        } else { // collaborator doesn't exist (when invited through link) -> create
            const newCollaborator = this.getRepository(Collaborator).create({
                project: invite.project,
                user,
                email: invite.email,
                status: ECollaboratorStatus.ACCEPTED,
                permission: ECollaboratorPermission.READ
            });
            await this.getRepository(Collaborator).save(newCollaborator);
        }

        await this.getRepository(Invite).delete({ id: invite.id });

        return { message: 'Invite accepted' };
    }

    async cancelInvite(email: string, currentUser: AuthUser) {
        // can be cancelled either by creator or collaborator
        const invite = await this.getRepository(Invite).findOne({
            where: { email },
            relations: { project: { createdBy: { account: true } } },
            select: { id: true, email: true, project: { id: true, createdBy: { id: true, account: { id: true, email: true } } } }
        });

        if (!invite) throw new NotFoundException('Invite not found.');

        const authorEmail = invite.project.createdBy.account.email;

        if (![authorEmail, email].includes(currentUser.email)) throw new ForbiddenException('Access denied.');

        await this.getRepository(Invite).delete({ email });
        await this.getRepository(Collaborator).delete({ email });

        return { message: 'Invite cancelled' }
    }
}
