import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { EPasskeyChallengeType } from "../entities/passkey-challenge.entity";
import { ApiProperty } from "@nestjs/swagger";

export class AuthChallengeDto {
    @ApiProperty({ type: 'string', description: 'Email' })
    @IsEmail()
    email!: string;

    @ApiProperty({ type: 'string', enum: EPasskeyChallengeType, description: 'Challenge type' })
    @IsEnum(EPasskeyChallengeType)
    @IsOptional()
    type?: EPasskeyChallengeType = EPasskeyChallengeType.Login
}