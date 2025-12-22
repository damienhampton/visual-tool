import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import type { DiagramData } from '../../entities/diagram-version.entity';

export class CreateDiagramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsObject()
  @IsOptional()
  data?: DiagramData;
}
