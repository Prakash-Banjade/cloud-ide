import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { ELanguage } from "src/common/global.types";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20, { message: "Project name must be less than 20 characters." })
    projectName: string;

    @IsEnum(ELanguage)
    language: ELanguage;
}

export class ResourceStartDto {
    @IsString()
    @IsNotEmpty()
    replId: string;
}
