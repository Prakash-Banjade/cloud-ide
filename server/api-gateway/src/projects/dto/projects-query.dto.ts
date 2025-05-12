import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ELanguage } from "src/common/global.types";

export class ProjectsQueryDto extends QueryDto {
    @ApiPropertyOptional({ enum: ELanguage, example: ELanguage.REACT_JS })
    @IsEnum(ELanguage)
    @IsOptional()
    language?: ELanguage;
}