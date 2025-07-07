import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { ELanguage } from "src/common/global.types";

const sortByObj = {
    "createdAt": "project.createdAt",
    "lastOpened": "project.updatedAt",
    "name": "LOWER(project.name)",
}

export class ProjectsQueryDto extends QueryDto {
    @ApiPropertyOptional({ enum: ELanguage, example: ELanguage.REACT_JS })
    @IsEnum(ELanguage)
    @IsOptional()
    language?: ELanguage;


    @ApiPropertyOptional({ enum: Object.keys(sortByObj), example: sortByObj.lastOpened })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sortByObj[value] ?? sortByObj.lastOpened)
    sortBy: string = sortByObj.lastOpened;

    @ApiPropertyOptional({ type: Boolean, example: true })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    collab: boolean = false;
}