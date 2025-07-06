import { IsEmail, IsEnum, IsUUID } from "class-validator";
import { ECollaboratorPermission } from "../entities/collaborator.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCollaboratorDto {
    @IsEmail()
    email: string;
}

export class UpdateCollaboratorDto {
    @ApiProperty({ type: 'string', enum: ECollaboratorPermission, example: ECollaboratorPermission.READ })
    @IsEnum(ECollaboratorPermission)
    permission: ECollaboratorPermission;
}

export class CollaboratorsQueryDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Project ID' })
    @IsUUID()
    projectId: string;
}