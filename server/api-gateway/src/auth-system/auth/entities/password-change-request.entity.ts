import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PasswordChangeRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar')
    email: string;

    @Column('varchar')
    hashedResetToken: string;

    @Column('timestamp')
    createdAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    setCreatedAt() {
        this.createdAt = new Date();
    }
}