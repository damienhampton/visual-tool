import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Diagram } from './diagram.entity';
import { User } from './user.entity';

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Entity('diagram_collaborators')
export class DiagramCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diagram_id' })
  diagramId: string;

  @ManyToOne(() => Diagram, (diagram) => diagram.collaborators)
  @JoinColumn({ name: 'diagram_id' })
  diagram: Diagram;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.collaborations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: CollaboratorRole,
    default: CollaboratorRole.VIEWER,
  })
  role: CollaboratorRole;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
