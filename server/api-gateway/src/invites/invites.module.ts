import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { Project } from 'src/projects/entities/project.entity';
import { EncryptionModule } from 'src/auth-system/encryption/encryption.module';
import { InvitesHelperService } from './invites-helper.service';
import { CollaboratorsModule } from 'src/collaborators/collaborators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invite,
      Project,
    ]),
    EncryptionModule,
    CollaboratorsModule,
  ],
  controllers: [InvitesController],
  providers: [
    InvitesService,
    InvitesHelperService,
  ],
})
export class InvitesModule { }
