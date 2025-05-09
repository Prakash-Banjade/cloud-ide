import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Length, Matches } from "class-validator";
import { NAME_REGEX, NAME_WITH_SPACE_REGEX } from "src/common/CONSTANTS";

export class UpdateUserDto {
    @ApiPropertyOptional({ type: 'string', description: 'First name of the user' })
    @Matches(NAME_REGEX, { message: 'First name can only contain letters.' })
    @Length(1, 50, { message: 'First name must be less than 50 characters.' })
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ type: 'string', description: 'Last name of the user' })
    @Matches(NAME_WITH_SPACE_REGEX, { message: 'Last name can only contain letters and spaces.' })
    @Length(1, 50, { message: 'Last name must be less than 50 characters.' })
    @IsOptional()
    lastName?: string = '';
}
