import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class UpdateUserDto {
    @ApiPropertyOptional({ type: 'string', description: 'First name of the user' })
    @IsString()
    @IsNotEmpty()
    @Length(2)
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ type: 'string', description: 'Last name of the user' })
    @IsString()
    @IsOptional()
    lastName?: string = '';
}
