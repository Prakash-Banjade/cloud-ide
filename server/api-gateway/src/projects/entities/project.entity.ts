import { User } from "src/auth-system/users/entities/user.entity";
import { BaseEntity } from "src/common/base.entity";
import { Entity, Index, ManyToOne } from "typeorm";

@Entity()
export class Project extends BaseEntity {
    @Index()
    @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE', nullable: false })
    createdBy: User
}
