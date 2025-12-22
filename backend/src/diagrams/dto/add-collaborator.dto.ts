import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { CollaboratorRole } from '../../entities/diagram-collaborator.entity';

export class AddCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}
