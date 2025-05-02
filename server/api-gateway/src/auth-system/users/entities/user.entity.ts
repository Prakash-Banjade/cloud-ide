import { Entity, JoinColumn, OneToOne } from "typeorm";
import { Account } from "src/auth-system/accounts/entities/account.entity";
import { BaseEntity } from "src/common/base.entity";

@Entity()
export class User extends BaseEntity {
    @OneToOne(() => Account, account => account.user, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn()
    account: Account;
}
