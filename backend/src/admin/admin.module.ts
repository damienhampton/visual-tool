import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { User } from '../entities/user.entity';
import { Diagram } from '../entities/diagram.entity';
import { DiagramVersion } from '../entities/diagram-version.entity';
import { DiagramCollaborator } from '../entities/diagram-collaborator.entity';
import { Subscription } from '../entities/subscription.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Diagram,
      DiagramVersion,
      DiagramCollaborator,
      Subscription,
      AuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditLogService],
})
export class AdminModule {}
