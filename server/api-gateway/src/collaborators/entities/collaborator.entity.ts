import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/base.entity";
import { Project } from "src/projects/entities/project.entity";
import { Column, Entity, ManyToOne } from "typeorm";

export enum ECollaboratorStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined'
}

export enum ECollaboratorPermission {
    NONE = 'none',
    READ = 'read',
    WRITE = 'write'
}

export const MAX_COLLABORATORS = 5 as const;

@Entity()
export class Collaborator extends BaseEntity {
    @ManyToOne(() => User, user => user.collaborators, { onDelete: 'CASCADE', nullable: true })
    user: User | null;

    @ManyToOne(() => Project, project => project.collaborators, { onDelete: 'CASCADE', nullable: false })
    project: Project;

    @Column({ type: 'varchar' })
    email: string;

    @Column({ type: 'enum', enum: ECollaboratorStatus, default: ECollaboratorStatus.PENDING })
    status: ECollaboratorStatus;

    @Column({ type: 'enum', enum: ECollaboratorPermission, default: ECollaboratorPermission.NONE })
    permission: ECollaboratorPermission;
}
