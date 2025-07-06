import { Module } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaborator } from './entities/collaborator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Collaborator,
    ])
  ],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule { }
