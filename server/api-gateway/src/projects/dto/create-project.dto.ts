import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ELanguage } from "src/common/global.types";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50, { message: "Project name must be less than 50 characters." })
    projectName: string;

    @IsEnum(ELanguage)
    language: ELanguage;
}

export class ResourceStartDto {
    @IsString()
    @IsNotEmpty()
    replId: string;
}
