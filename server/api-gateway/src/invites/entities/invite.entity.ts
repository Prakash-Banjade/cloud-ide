import { BaseEntity } from "src/common/base.entity";
import { Project } from "src/projects/entities/project.entity";
import { Column, Entity, Index, ManyToOne } from "typeorm";

@Entity()
@Index(['project', 'email'], { unique: true })
export class Invite extends BaseEntity {
    @ManyToOne(() => Project, project => project.invites, { onDelete: 'CASCADE', nullable: false })
    project: Project;

    @Column({ type: 'text' })
    tokenHash: string; // this token is the hash of a jwt token, so expiry will be handled by jwt

    @Column({ type: 'text' })
    invitationLink: string;

    @Column({ type: 'numeric' })
    expiresIn: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', nullable: true })
    email: string | null; // if email exists, it means the user has invited through mail not invitation link
}