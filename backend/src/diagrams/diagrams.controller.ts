import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DiagramsService } from './diagrams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { UpdateDiagramDto } from './dto/update-diagram.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';

@Controller('diagrams')
@UseGuards(JwtAuthGuard)
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @Post()
  create(@Body() createDiagramDto: CreateDiagramDto, @CurrentUser() user: User) {
    return this.diagramsService.create(createDiagramDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.diagramsService.findAll(user);
  }

  @Get('shared/:token')
  findByShareToken(
    @Param('token') token: string,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.findByShareToken(token, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDiagramDto: UpdateDiagramDto,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.update(id, updateDiagramDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.remove(id, user);
  }

  @Post(':id/share')
  regenerateShareToken(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.regenerateShareToken(id, user);
  }

  @Get(':id/collaborators')
  getCollaborators(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.getCollaborators(id, user);
  }

  @Post(':id/collaborators')
  addCollaborator(
    @Param('id') id: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.addCollaborator(id, addCollaboratorDto, user);
  }

  @Delete(':id/collaborators/:userId')
  removeCollaborator(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.removeCollaborator(id, userId, user);
  }
}
