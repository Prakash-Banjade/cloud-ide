import { PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export abstract class BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn({ nullable: true })
    updatedAt: string;

    @DeleteDateColumn({ nullable: true })
    deletedAt: string;
}