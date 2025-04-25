import { Transform } from "class-transformer";
import { ELanguage } from "../../types";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { generateSlug } from "src/utils";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(12) 
    @Transform(({ value }) => generateSlug(value)) // TODO: add nano id also
    replId: string;

    @IsEnum(ELanguage)
    language: ELanguage;
}
