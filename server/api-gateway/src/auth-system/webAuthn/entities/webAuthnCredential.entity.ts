import { Account } from "src/auth-system/accounts/entities/account.entity";
import { Column, Entity, Index, ManyToOne } from "typeorm";
import { AuthenticatorTransportFuture, CredentialDeviceType } from "@simplewebauthn/server";
import { BaseEntity } from "src/common/base.entity";

@Entity()
export class WebAuthnCredential extends BaseEntity {
    @Index()
    @ManyToOne(() => Account, account => account.webAuthnCredentials, { onDelete: 'CASCADE' })
    account: Account

    @Column({ type: "varchar" })
    name: string;

    @Column()
    credentialId: string;

    @Column({ type: 'bytea' })
    publicKey: Buffer;

    @Column({ type: 'varchar' })
    deviceType: CredentialDeviceType;

    @Column({ type: 'boolean', default: false })
    backedUp: boolean;

    @Column({ type: 'int', default: 0 })
    counter: number;

    @Column({ type: 'text', array: true })
    transports?: AuthenticatorTransportFuture[];

    @Column({ type: 'timestamp', nullable: true })
    lastUsed: Date;
}