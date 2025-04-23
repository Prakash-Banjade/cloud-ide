import { ELanguage } from "../../types";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(12)
    replId: string;

    @IsEnum(ELanguage)
    language: ELanguage;
}
