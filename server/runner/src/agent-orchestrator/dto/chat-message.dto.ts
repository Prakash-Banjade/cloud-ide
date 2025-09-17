import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum EContextSelection {
    FILE = 'file',
    FILES = 'files',
    REPO = 'repo',
}

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    selectedFilePath?: string

    @IsEnum(EContextSelection)
    contextSelection?: EContextSelection = EContextSelection.FILE;
}