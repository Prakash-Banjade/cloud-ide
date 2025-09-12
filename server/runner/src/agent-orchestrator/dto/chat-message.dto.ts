import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    selectedFilePath?: string

    @IsEnum(['file', 'files', 'repo'])
    contextSelection?: 'file' | 'files' | 'repo';
}