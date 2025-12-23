import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthModule } from '../src/auth/auth.module';
import { DiagramsModule } from '../src/diagrams/diagrams.module';
import { CollaborationModule } from '../src/collaboration/collaboration.module';
import { SubscriptionsModule } from '../src/subscriptions/subscriptions.module';
import { AdminModule } from '../src/admin/admin.module';
import { User } from '../src/entities/user.entity';
import { Diagram } from '../src/entities/diagram.entity';
import { DiagramVersion } from '../src/entities/diagram-version.entity';
import { DiagramCollaborator } from '../src/entities/diagram-collaborator.entity';
import { Subscription } from '../src/entities/subscription.entity';
import { AuditLog } from '../src/entities/audit-log.entity';
import { ActivityTrackerMiddleware } from '../src/auth/middleware/activity-tracker.middleware';

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
    TypeOrmModule.forFeature([User]),
    AuthModule,
    DiagramsModule,
    CollaborationModule,
    SubscriptionsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityTrackerMiddleware)
      .forRoutes('*');
  }
}
