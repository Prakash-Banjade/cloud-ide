import { Column, Entity, Index, ManyToOne } from "typeorm";
import { Account } from "./account.entity";
import { BaseEntity } from "src/common/base.entity";

@Entity()
export class LoginDevice extends BaseEntity {
    @ManyToOne(() => Account, account => account.loginDevices, { onDelete: 'CASCADE', nullable: false })
    account: Account;

    @Index({ unique: true })
    @Column({ type: 'varchar', nullable: false })
    deviceId: string;

    @Column({ type: 'text', nullable: false })
    ua: string;

    @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
    firstLogin: Date;

    @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
    lastLogin: Date

    @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
    lastActivityRecord: Date

    @Column({ type: 'boolean', default: false })
    isTrusted: boolean;
}