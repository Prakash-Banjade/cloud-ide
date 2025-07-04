import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateInviteDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Project ID' })
    @IsUUID()
    projectId: string;
}