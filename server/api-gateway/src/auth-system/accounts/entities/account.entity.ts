import { BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { User } from "src/auth-system/users/entities/user.entity";
import { WebAuthnCredential } from "src/auth-system/webAuthn/entities/webAuthnCredential.entity";
import { LoginDevice } from "./login-devices.entity";
import { BaseEntity } from "src/common/base.entity";
import { BCRYPT_HASH, EMAIL_REGEX, PASSWORD_SALT_COUNT } from "src/common/CONSTANTS";
import * as bcrypt from "bcryptjs";
import { BadRequestException } from "@nestjs/common";


@Entity()
export class Account extends BaseEntity {
    @Column({ type: 'varchar' })
    firstName!: string;

    @Column({ type: 'varchar', default: '' })
    lastName?: string;

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    password?: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date | null = null;

    @Column({ type: 'text', array: true })
    prevPasswords: string[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    passwordUpdatedAt: Date;

    @BeforeInsert()
    hashPassword() {
        if (this.password && !BCRYPT_HASH.test(this.password)) {
            console.log(BCRYPT_HASH.test(this.password))
            this.password = bcrypt.hashSync(this.password, PASSWORD_SALT_COUNT);
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    validateEmail() {
        if (this.email && !EMAIL_REGEX.test(this.email)) throw new BadRequestException('Invalid email');
    }

    @OneToMany(() => WebAuthnCredential, passkey => passkey.account)
    webAuthnCredentials: WebAuthnCredential[];

    @OneToMany(() => LoginDevice, loginDevice => loginDevice.account)
    loginDevices: LoginDevice[];

    @Column({ type: 'timestamp', nullable: true })
    twoFaEnabledAt: Date | null;

    @OneToOne(() => User, user => user.account, { nullable: true, cascade: true })
    user: User;
}
