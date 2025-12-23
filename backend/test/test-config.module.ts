import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../src/entities/user.entity';
import { Diagram } from '../src/entities/diagram.entity';
import { DiagramVersion } from '../src/entities/diagram-version.entity';
import { DiagramCollaborator } from '../src/entities/diagram-collaborator.entity';
import { Subscription } from '../src/entities/subscription.entity';
import { AuditLog } from '../src/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, Diagram, DiagramVersion, DiagramCollaborator, Subscription, AuditLog],
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
  ],
})
export class TestConfigModule {}
