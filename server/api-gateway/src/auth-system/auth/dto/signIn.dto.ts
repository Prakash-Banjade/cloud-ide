import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, Matches } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX } from "src/common/CONSTANTS";

export class SignInDto {
    @ApiProperty({ type: 'string', description: 'Email', format: 'email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ type: 'string', description: 'Password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RegisterDto {
    @ApiProperty({ type: 'string', description: 'Email', format: 'email' })
    @IsEmail()
    @Transform(({ value }) => value?.trim())
    email: string;

    @ApiProperty({ type: 'string', description: 'Password' })
    @IsStrongPassword()
    password: string;

    @ApiProperty({ type: 'string', description: 'First name' })
    @IsString()
    @Matches(NAME_REGEX, { message: 'First name can only contain letters.' })
    @Transform(({ value }) => value?.trim())
    firstName: string;

    @ApiPropertyOptional({ type: 'string', description: 'Last name' })
    @IsString()
    @Matches(NAME_WITH_SPACE_REGEX, { message: 'Last name can only contain letters and spaces.' })
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    lastName?: string;
}