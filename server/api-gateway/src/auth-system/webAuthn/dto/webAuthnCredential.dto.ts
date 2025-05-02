import { ApiProperty } from "@nestjs/swagger";
import { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { IsDefined, IsNotEmpty, IsString } from "class-validator";

export class UpdateWebAuthnCredentialDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;
}

export class VerifyRegisterPassKeyDto {
    @ApiProperty({ description: 'Registration response after passkey register prompt has completed.' })
    @IsNotEmpty({ message: 'Registration response is required' })
    @IsDefined()
    registrationResponse: RegistrationResponseJSON
}

export class AuthenticatePassKeyDto {
    @ApiProperty({ description: 'Authentication response after passkey login prompt has completed.' })
    @IsNotEmpty({ message: 'Authentication response is required' })
    @IsDefined()
    authenticationResponse: AuthenticationResponseJSON
}