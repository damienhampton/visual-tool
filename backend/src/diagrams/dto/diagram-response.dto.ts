import { DiagramData } from '../../entities/diagram-version.entity';
import { CollaboratorRole } from '../../entities/diagram-collaborator.entity';

export class DiagramResponseDto {
  id: string;
  title: string;
  ownerId: string;
  shareToken: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentVersion?: {
    version: number;
    data: DiagramData;
    createdAt: Date;
  };
  userRole?: CollaboratorRole;
}

export class DiagramListItemDto {
  id: string;
  title: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userRole?: CollaboratorRole;
}
