import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from "bcryptjs";
import { PASSWORD_SALT_COUNT } from "src/common/CONSTANTS";

export enum EOptVerificationType {
    EMAIL_VERIFICATION = 'email-verification',
    TWOFACTOR_VERIFICATION = 'twofactor-verification'
}

@Entity()
export class OtpVerificationPending {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column('varchar')
    email: string;

    @Column('varchar')
    hashedVerificationToken: string;

    @Column({ type: 'enum', enum: EOptVerificationType })
    type: EOptVerificationType;

    @Column('varchar')
    otp: string;

    @Column('timestamp')
    createdAt: Date;

    @Column({ type: 'text', nullable: true })
    deviceId: string;

    @BeforeInsert()
    @BeforeUpdate()
    setCreatedAt() {
        this.createdAt = new Date();
    }

    @BeforeInsert()
    @BeforeUpdate()
    hashOtp() {
        this.otp = bcrypt.hashSync(this.otp, PASSWORD_SALT_COUNT);
    }
}