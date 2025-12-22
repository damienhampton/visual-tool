import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DiagramsModule } from './diagrams/diagrams.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { User } from './entities/user.entity';
import { Diagram } from './entities/diagram.entity';
import { DiagramVersion } from './entities/diagram-version.entity';
import { DiagramCollaborator } from './entities/diagram-collaborator.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Diagram, DiagramVersion, DiagramCollaborator],
        synchronize: true, // Set to false in production, use migrations instead
      }),
    }),
    AuthModule,
    DiagramsModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
