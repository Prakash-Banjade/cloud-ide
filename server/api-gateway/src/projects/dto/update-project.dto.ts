import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateProjectDto extends PartialType(OmitType(CreateProjectDto, ['language'] as const)) { }
