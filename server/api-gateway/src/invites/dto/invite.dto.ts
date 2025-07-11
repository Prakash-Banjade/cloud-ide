import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsUUID } from "class-validator";

export class CreateInviteDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Project ID' })
    @IsUUID()
    projectId: string;
}

export class SendInvitationDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Project ID' })
    @IsUUID()
    projectId: string;

    @ApiProperty({ type: 'string', format: 'email', description: 'User email' })
    @IsEmail()
    @Transform(({ value }) => value?.trim())
    email: string;
}

export class CancelInviteDto {
    @ApiProperty({ type: 'string', format: 'email', description: 'User email' })
    @IsEmail()
    email: string;
}