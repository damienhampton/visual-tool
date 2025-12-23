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
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDiagramDto: CreateDiagramDto, @CurrentUser() user: User) {
    return this.diagramsService.create(createDiagramDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.diagramsService.findAll(user);
  }

  @Get('shared/:token')
  findByShareToken(
    @Param('token') token: string,
    @CurrentUser() user?: User,
  ) {
    return this.diagramsService.findByShareToken(token, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDiagramDto: UpdateDiagramDto,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.update(id, updateDiagramDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.remove(id, user);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  regenerateShareToken(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.regenerateShareToken(id, user);
  }

  @Get(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  getCollaborators(@Param('id') id: string, @CurrentUser() user: User) {
    return this.diagramsService.getCollaborators(id, user);
  }

  @Post(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  addCollaborator(
    @Param('id') id: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.addCollaborator(id, addCollaboratorDto, user);
  }

  @Delete(':id/collaborators/:userId')
  @UseGuards(JwtAuthGuard)
  removeCollaborator(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    return this.diagramsService.removeCollaborator(id, userId, user);
  }
}
