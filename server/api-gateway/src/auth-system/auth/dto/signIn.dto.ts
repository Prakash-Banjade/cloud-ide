import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

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