import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagramsService } from './diagrams.service';
import { DiagramsController } from './diagrams.controller';
import { Diagram } from '../entities/diagram.entity';
import { DiagramVersion } from '../entities/diagram-version.entity';
import { DiagramCollaborator } from '../entities/diagram-collaborator.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diagram, DiagramVersion, DiagramCollaborator]),
    AuthModule,
  ],
  controllers: [DiagramsController],
  providers: [DiagramsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
