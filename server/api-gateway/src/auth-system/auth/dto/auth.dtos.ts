import { BadRequestException } from "@nestjs/common";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";

export class EmailOnlyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email!: string;
}

export class OtpVerificationDto {
    @ApiProperty({ type: Number, description: "6 digit OTP" })
    @Transform(({ value }) => {
        if (isNaN(parseInt(value))) throw new BadRequestException('Invalid OTP')
        return parseInt(value)
    })
    @IsInt()
    @IsNotEmpty()
    otp: number

    @ApiProperty({ type: String, description: "Verification token" })
    @IsString()
    @IsNotEmpty()
    verificationToken: string;
}

export class ResendTwofaOtpDto extends OmitType(OtpVerificationDto, ['otp'] as const) { }

export class ChangePasswordDto {
    @ApiProperty({ type: "string", description: 'Current password' })
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @ApiProperty({ type: "string", description: 'New password' })
    @IsString()
    @IsStrongPassword()
    newPassword!: string;

    @ApiProperty({ type: Boolean, description: 'Logout out of all devices flag. If true, user will be logged out of all devices' })
    @IsBoolean()
    @IsOptional()
    logout?: boolean = false;
}

export class ResetPasswordDto {
    @ApiProperty({ type: "string", description: 'Password' })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({}, { message: 'Password is not strong enough' })
    password!: string;

    @ApiProperty({ type: "string", description: 'Token' })
    @IsString()
    @IsNotEmpty()
    token!: string;
}

export class UpdateEmailDto {
    @IsEmail()
    @ApiProperty({ type: "string", description: 'New email' })
    newEmail: string;

    @ApiProperty({ type: "string", description: 'Password' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class VerifyTokenDto {
    @ApiProperty({ type: "string", description: 'Verification token' })
    @IsString()
    @IsNotEmpty()
    token: string;
}

export class VerifySudoDto {
    @ApiProperty({ type: "string", description: 'Sudo Password' })
    @IsString()
    @IsNotEmpty()
    sudo_password: string;
}

