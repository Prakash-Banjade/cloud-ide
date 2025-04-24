import { IsNotEmpty, IsString } from "class-validator";

export class ResourceStartDto {
    @IsString()
    @IsNotEmpty()
    replId: string;
}