import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { DiagramVersion } from './diagram-version.entity';
import { DiagramCollaborator } from './diagram-collaborator.entity';

@Entity('diagrams')
export class Diagram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.diagrams)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ unique: true, name: 'share_token' })
  shareToken: string;

  @Column({ default: false, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DiagramVersion, (version) => version.diagram)
  versions: DiagramVersion[];

  @OneToMany(() => DiagramCollaborator, (collaborator) => collaborator.diagram)
  collaborators: DiagramCollaborator[];
}
