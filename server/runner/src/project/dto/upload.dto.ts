import { IsNotEmpty } from "class-validator";
import { IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";

export class UploadDto {
    @IsFile({ each: true })
    @MaxFileSize(5 * 1024 * 1024, { each: true, message: 'File size should be less than 5MB' })
    @IsNotEmpty({ each: true })
    files: MemoryStoredFile[]
}
