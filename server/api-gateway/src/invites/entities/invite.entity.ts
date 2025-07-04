import { BaseEntity } from "src/common/base.entity";
import { Project } from "src/projects/entities/project.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Invite extends BaseEntity {
    @ManyToOne(() => Project, project => project.invites, { onDelete: 'CASCADE' })
    project: Project;

    @Column({ type: 'text', nullable: false })
    tokenHash: string; // this token is the hash of a jwt token, so expiry will be handled by jwt
}