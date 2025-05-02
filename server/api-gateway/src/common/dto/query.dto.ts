import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsDto } from "./pageOptions.dto";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export enum Deleted {
    ONLY = "only",
    NONE = "none",
    ALL = "all",
}

export class QueryDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: "string", enum: Deleted, description: "Option for deleted records", default: Deleted.NONE })
    @IsEnum(Deleted, { message: "Invalid deleted option" })
    @IsOptional()
    deleted: Deleted = Deleted.NONE

    @ApiPropertyOptional({ type: "string", description: "Search query", default: "" })
    @IsOptional()
    search?: string

    @ApiPropertyOptional({ type: Boolean, default: false, description: "Skip pagination flag" })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    skipPagination?: boolean = false;
}