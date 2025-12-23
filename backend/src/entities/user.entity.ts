import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Diagram } from './diagram.entity';
import { DiagramCollaborator } from './diagram-collaborator.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ default: false })
  isGuest: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastActiveAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  @OneToMany(() => Diagram, (diagram) => diagram.owner)
  diagrams: Diagram[];

  @OneToMany(() => DiagramCollaborator, (collaborator) => collaborator.user)
  collaborations: DiagramCollaborator[];
}
