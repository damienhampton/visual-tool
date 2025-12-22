import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';
import type { DiagramData } from '../../entities/diagram-version.entity';

export class UpdateDiagramDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsObject()
  @IsOptional()
  data?: DiagramData;
}
