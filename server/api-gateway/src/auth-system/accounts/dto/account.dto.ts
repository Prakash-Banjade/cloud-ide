import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX } from "src/common/CONSTANTS";

export class UpdateAccountDto {
    @IsString()
    @IsNotEmpty()
    @Matches(NAME_REGEX, {
        message: 'Name can have only alphabets'
    })
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(NAME_WITH_SPACE_REGEX, {
        message: 'Seems like invalid last name'
    })
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    constructor(obj: UpdateAccountDto) {
        obj.email && (this.email = obj.email);
        obj.firstName && (this.firstName = obj.firstName)
        obj.lastName && (this.lastName = obj.lastName)
    }
}

export class Toggle2faDto {
    @ApiProperty({ type: 'boolean', description: 'Toggle 2FA flag' })
    @IsBoolean()
    toggle: boolean;
}