import { Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/base.entity";
import { Project } from "src/projects/entities/project.entity";
import { Collaborator } from "src/collaborators/entities/collaborator.entity";

@Entity()
export class User extends BaseEntity {
    @OneToOne(() => Account, account => account.user, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    account: Account;

    @OneToMany(() => Project, project => project.createdBy)
    projects: Project[];

    @OneToMany(() => Collaborator, collaborator => collaborator.user)
    collaborators: Collaborator[];
}
