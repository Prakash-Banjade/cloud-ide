import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/base.entity";
import { ELanguage } from "src/common/global.types";
import { Column, Entity, Index, ManyToOne } from "typeorm";

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
}
