import { IsEmail, IsEnum, IsUUID } from "class-validator";
import { EPermission } from "../entities/collaborator.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCollaboratorDto {
    @IsEmail()
    email: string;
}

export class UpdateCollaboratorDto {
    @ApiProperty({ type: 'string', enum: EPermission, example: EPermission.READ })
    @IsEnum(EPermission)
    permission: EPermission;
}

export class CollaboratorsQueryDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Project ID' })
    @IsUUID()
    projectId: string;
}