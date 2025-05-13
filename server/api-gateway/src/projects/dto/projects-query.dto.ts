import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ELanguage } from "src/common/global.types";

const sortByObj = {
    "createdAt": "project.createdAt",
    "lastUpdated": "project.updatedAt",
    "name": "project.name",
}

export class ProjectsQueryDto extends QueryDto {
    @ApiPropertyOptional({ enum: ELanguage, example: ELanguage.REACT_JS })
    @IsEnum(ELanguage)
    @IsOptional()
    language?: ELanguage;


    @ApiPropertyOptional({ enum: Object.keys(sortByObj), example: sortByObj.lastUpdated })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sortByObj[value] ?? sortByObj.lastUpdated)
    sortBy: string = sortByObj.lastUpdated;
}