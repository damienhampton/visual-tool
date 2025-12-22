import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Diagram } from '../entities/diagram.entity';
import { DiagramVersion } from '../entities/diagram-version.entity';
import { DiagramCollaborator, CollaboratorRole } from '../entities/diagram-collaborator.entity';
import { User } from '../entities/user.entity';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { UpdateDiagramDto } from './dto/update-diagram.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { DiagramResponseDto, DiagramListItemDto } from './dto/diagram-response.dto';

@Injectable()
export class DiagramsService {
  constructor(
    @InjectRepository(Diagram)
    private diagramRepository: Repository<Diagram>,
    @InjectRepository(DiagramVersion)
    private versionRepository: Repository<DiagramVersion>,
    @InjectRepository(DiagramCollaborator)
    private collaboratorRepository: Repository<DiagramCollaborator>,
  ) {}

  async create(createDiagramDto: CreateDiagramDto, user: User): Promise<DiagramResponseDto> {
    const shareToken = this.generateShareToken();

    const diagram = this.diagramRepository.create({
      title: createDiagramDto.title,
      ownerId: user.id,
      shareToken,
      isPublic: false,
    });

    await this.diagramRepository.save(diagram);

    const collaborator = this.collaboratorRepository.create({
      diagramId: diagram.id,
      userId: user.id,
      role: CollaboratorRole.OWNER,
    });

    await this.collaboratorRepository.save(collaborator);

    if (createDiagramDto.data) {
      const version = this.versionRepository.create({
        diagramId: diagram.id,
        version: 1,
        data: createDiagramDto.data,
        createdBy: user.id,
      });

      await this.versionRepository.save(version);
    }

    return this.toDiagramResponse(diagram, CollaboratorRole.OWNER);
  }

  async findAll(user: User): Promise<DiagramListItemDto[]> {
    const collaborations = await this.collaboratorRepository.find({
      where: { userId: user.id },
      relations: ['diagram'],
    });

    return collaborations.map(collab => ({
      id: collab.diagram.id,
      title: collab.diagram.title,
      ownerId: collab.diagram.ownerId,
      isPublic: collab.diagram.isPublic,
      createdAt: collab.diagram.createdAt,
      updatedAt: collab.diagram.updatedAt,
      userRole: collab.role,
    }));
  }

  async findOne(id: string, user: User): Promise<DiagramResponseDto> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (!role) {
      throw new ForbiddenException('You do not have access to this diagram');
    }

    const latestVersion = await this.versionRepository.findOne({
      where: { diagramId: id },
      order: { version: 'DESC' },
    });

    return this.toDiagramResponse(diagram, role, latestVersion || undefined);
  }

  async findByShareToken(shareToken: string, user?: User): Promise<DiagramResponseDto> {
    const diagram = await this.diagramRepository.findOne({
      where: { shareToken },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    let role: CollaboratorRole | null = null;

    if (user) {
      role = await this.getUserRole(diagram.id, user.id);
      
      if (!role) {
        const collaborator = this.collaboratorRepository.create({
          diagramId: diagram.id,
          userId: user.id,
          role: CollaboratorRole.VIEWER,
        });
        await this.collaboratorRepository.save(collaborator);
        role = CollaboratorRole.VIEWER;
      }
    }

    const latestVersion = await this.versionRepository.findOne({
      where: { diagramId: diagram.id },
      order: { version: 'DESC' },
    });

    return this.toDiagramResponse(diagram, role || CollaboratorRole.VIEWER, latestVersion || undefined);
  }

  async update(id: string, updateDiagramDto: UpdateDiagramDto, user: User): Promise<DiagramResponseDto> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (!role || (role !== CollaboratorRole.OWNER && role !== CollaboratorRole.EDITOR)) {
      throw new ForbiddenException('You do not have permission to edit this diagram');
    }

    if (updateDiagramDto.title !== undefined) {
      diagram.title = updateDiagramDto.title;
    }

    if (updateDiagramDto.isPublic !== undefined && role === CollaboratorRole.OWNER) {
      diagram.isPublic = updateDiagramDto.isPublic;
    }

    await this.diagramRepository.save(diagram);

    if (updateDiagramDto.data) {
      const latestVersion = await this.versionRepository.findOne({
        where: { diagramId: id },
        order: { version: 'DESC' },
      });

      const newVersion = this.versionRepository.create({
        diagramId: id,
        version: (latestVersion?.version || 0) + 1,
        data: updateDiagramDto.data,
        createdBy: user.id,
      });

      await this.versionRepository.save(newVersion);
    }

    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (role !== CollaboratorRole.OWNER) {
      throw new ForbiddenException('Only the owner can delete this diagram');
    }

    await this.diagramRepository.remove(diagram);
  }

  async regenerateShareToken(id: string, user: User): Promise<{ shareToken: string }> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (role !== CollaboratorRole.OWNER) {
      throw new ForbiddenException('Only the owner can regenerate the share token');
    }

    diagram.shareToken = this.generateShareToken();
    await this.diagramRepository.save(diagram);

    return { shareToken: diagram.shareToken };
  }

  async addCollaborator(id: string, addCollaboratorDto: AddCollaboratorDto, user: User): Promise<void> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (role !== CollaboratorRole.OWNER) {
      throw new ForbiddenException('Only the owner can add collaborators');
    }

    const existingCollaborator = await this.collaboratorRepository.findOne({
      where: { diagramId: id, userId: addCollaboratorDto.userId },
    });

    if (existingCollaborator) {
      throw new BadRequestException('User is already a collaborator');
    }

    const collaborator = this.collaboratorRepository.create({
      diagramId: id,
      userId: addCollaboratorDto.userId,
      role: addCollaboratorDto.role,
    });

    await this.collaboratorRepository.save(collaborator);
  }

  async removeCollaborator(id: string, userId: string, user: User): Promise<void> {
    const diagram = await this.diagramRepository.findOne({
      where: { id },
    });

    if (!diagram) {
      throw new NotFoundException('Diagram not found');
    }

    const role = await this.getUserRole(id, user.id);

    if (role !== CollaboratorRole.OWNER) {
      throw new ForbiddenException('Only the owner can remove collaborators');
    }

    const collaborator = await this.collaboratorRepository.findOne({
      where: { diagramId: id, userId },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (collaborator.role === CollaboratorRole.OWNER) {
      throw new BadRequestException('Cannot remove the owner');
    }

    await this.collaboratorRepository.remove(collaborator);
  }

  async getCollaborators(id: string, user: User) {
    const role = await this.getUserRole(id, user.id);

    if (!role) {
      throw new ForbiddenException('You do not have access to this diagram');
    }

    const collaborators = await this.collaboratorRepository.find({
      where: { diagramId: id },
      relations: ['user'],
    });

    return collaborators.map(collab => ({
      userId: collab.userId,
      name: collab.user.name,
      email: collab.user.email,
      role: collab.role,
      addedAt: collab.addedAt,
    }));
  }

  private async getUserRole(diagramId: string, userId: string): Promise<CollaboratorRole | null> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { diagramId, userId },
    });

    return collaborator?.role || null;
  }

  private generateShareToken(): string {
    return randomBytes(16).toString('hex');
  }

  private toDiagramResponse(
    diagram: Diagram,
    role: CollaboratorRole,
    version?: DiagramVersion,
  ): DiagramResponseDto {
    return {
      id: diagram.id,
      title: diagram.title,
      ownerId: diagram.ownerId,
      shareToken: diagram.shareToken,
      isPublic: diagram.isPublic,
      createdAt: diagram.createdAt,
      updatedAt: diagram.updatedAt,
      userRole: role,
      currentVersion: version ? {
        version: version.version,
        data: version.data,
        createdAt: version.createdAt,
      } : undefined,
    };
  }
}
