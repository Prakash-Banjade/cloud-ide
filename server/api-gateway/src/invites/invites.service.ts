import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { Invite } from './entities/invite.entity';
import { CreateInviteDto, SendInvitationDto } from './dto/invite.dto';
import { AuthUser } from 'src/common/global.types';
import { Project } from 'src/projects/entities/project.entity';
import { InvitesHelperService } from './invites-helper.service';
import { TokenExpiredError } from '@nestjs/jwt';
import { BaseRepository } from 'src/common/base.repository';
import { REQUEST } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Collaborator, EPermission, ECollaboratorStatus, MAX_COLLABORATORS } from 'src/collaborators/entities/collaborator.entity';
import { User } from 'src/auth-system/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailEvents } from 'src/mail/mail.service';
import { SendInvitationEventDto } from 'src/mail/dto/events.dto';

@Injectable()
export class InvitesService extends BaseRepository {
    constructor(
        dataSource: DataSource, @Inject(REQUEST) req: FastifyRequest,
        private readonly invitesHelperService: InvitesHelperService,
        private readonly eventEmitter: EventEmitter2,
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
                project: { id: project.id },
                email: IsNull()
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
            relations: { collaborators: true, createdBy: { account: true } },
            select: {
                id: true,
                name: true,
                collaborators: { id: true, email: true },
                createdBy: {
                    id: true,
                    account: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        if (!project) throw new ForbiddenException('Access denied.');

        // check if maximum collaborators reached
        if (project.collaborators.length >= MAX_COLLABORATORS) throw new BadRequestException(`You can't invite more than ${MAX_COLLABORATORS} collaborators.`);

        // check of existing
        const existing = await this.getRepository(Invite).findOne({
            where: {
                project: { id: project.id },
                email: dto.email,
            },
            select: { id: true }
        });

        if (existing) throw new ConflictException("Invite already sent. Cancel existing invite first.");

        // check if existing collaborator
        const existingCollaborator = project.collaborators.some(collaborator => collaborator.email === dto.email);
        if (existingCollaborator) throw new ConflictException("Already a collaborator.");

        const { invitationLink, tokenHash, expiresIn } = this.invitesHelperService.generateLink(project.id);

        // check if user exists with the email
        const user = await this.getRepository(User).findOne({
            where: { account: { email: dto.email } },
            relations: { account: true },
            select: { id: true, account: { id: true, firstName: true, lastName: true } }
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

        const url = invitationLink + "&action=accept";

        // send email
        this.eventEmitter.emit(MailEvents.INVITATION, new SendInvitationEventDto({
            projectName: project.name,
            url,
            projectOwner: `${project.createdBy.account.firstName} ${project.createdBy.account.lastName}`,
            receiverEmail: dto.email,
            receiverName: user
                ? user?.account.firstName + ' ' + user?.account.lastName
                : "there", // fallback to Hello there,
        }));

        return { message: 'Invitation sent successfully' };
    }

    async validate(token: string) {
        const { error, payload, tokenHash } = this.invitesHelperService.validateToken(token);

        if (error || !payload?.projectId || !tokenHash) {
            throw new BadRequestException(error?.message || "Link has expired or invalid token.");
        };

        const invite = await this.getRepository(Invite).findOne({
            where: {
                tokenHash,
                project: { id: payload.projectId }
            },
            relations: { project: { createdBy: { account: true }, collaborators: true } },
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
                    },
                    collaborators: { id: true }
                }
            }
        });

        if (!invite) throw new NotFoundException('Invalid invitation');

        return invite;
    }

    async getDetails(token: string, currentUser: AuthUser) {
        const invite = await this.validate(token);

        if (invite.project.createdBy.id === currentUser.userId) throw new ForbiddenException('Access denied. Operation not allowed.'); // self accepting the invite

        if (invite.email && invite.email !== currentUser.email) throw new ForbiddenException('Access denied. You are not allowed to accept this invite.');

        return invite;
    }

    async acceptInvite(token: string, currentUser: AuthUser) {
        const invite = await this.validate(token);
        if (invite.project.createdBy.id === currentUser.userId) throw new ForbiddenException('Access denied. Operation not allowed.'); // self accepting the invite

        const user = await this.getRepository(User).findOne({ // current user -> collaborator
            where: { id: currentUser.userId },
            select: { id: true }
        });

        if (!user) throw new NotFoundException('User not found.');

        if (invite.email && invite.email !== currentUser.email) throw new ForbiddenException('Access denied. You are not allowed to accept this invite.');

        const collaborator = await this.getRepository(Collaborator).findOne({ // current user -> collaborator
            where: {
                email: currentUser.email,
                project: { id: invite.project.id },
                status: ECollaboratorStatus.PENDING
            },
            select: { id: true }
        });

        if (collaborator) { // collaborator exist (when invited through mail) -> update
            collaborator.user = user;
            collaborator.permission = EPermission.READ;
            collaborator.status = ECollaboratorStatus.ACCEPTED;
            await this.getRepository(Collaborator).save(collaborator);
        } else { // collaborator doesn't exist (when invited through link) -> create
            if (invite.project.collaborators.length >= MAX_COLLABORATORS) throw new BadRequestException(`Max collaborators reached. The project already has ${MAX_COLLABORATORS} collaborators. Reach out to the project owner for further details.`);

            const newCollaborator = this.getRepository(Collaborator).create({
                project: invite.project,
                user,
                email: currentUser.email,
                status: ECollaboratorStatus.ACCEPTED,
                permission: EPermission.READ
            });
            await this.getRepository(Collaborator).save(newCollaborator);
        }

        await this.getRepository(Invite).delete({ id: invite.id });

        return { message: 'Invite accepted', replId: invite.project.replId };
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
