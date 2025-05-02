import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ELanguage } from "src/common/global.types";
import { generateSlug } from "src/common/utils";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50, { message: "Project name must be less than 50 characters." })
    @Transform(({ value }) => generateSlug(value)) // TODO: add nano id also
    replId: string;

    @IsEnum(ELanguage)
    language: ELanguage;
}

export class ResourceStartDto {
    @IsString()
    @IsNotEmpty()
    replId: string;
}
