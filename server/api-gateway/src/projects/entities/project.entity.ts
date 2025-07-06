import { User } from "src/auth-system/users/entities/user.entity";
import { Collaborator } from "src/collaborators/entities/collaborator.entity";
import { BaseEntity } from "src/common/base.entity";
import { ELanguage } from "src/common/global.types";
import { Invite } from "src/invites/entities/invite.entity";
import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Project extends BaseEntity {
    @Index()
    @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE', nullable: false })
    createdBy: User

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    originalName: string;

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    replId: string;

    @Column({ type: 'enum', enum: ELanguage })
    language: ELanguage;

    @OneToMany(() => Invite, invite => invite.project)
    invites: Invite[]

    @OneToMany(() => Collaborator, collaborator => collaborator.project)
    collaborators: Collaborator[]
}
