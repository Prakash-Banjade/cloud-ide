import { ApiProperty } from "@nestjs/swagger";
import { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { IsDefined, IsEmail } from "class-validator";

export class AuthVerifyDto {
    @ApiProperty({ type: 'string', description: 'Email' })
    @IsEmail()
    email!: string;

    @ApiProperty({ description: 'Authentication response' })
    @IsDefined()
    authenticationResponse!: AuthenticationResponseJSON;
}