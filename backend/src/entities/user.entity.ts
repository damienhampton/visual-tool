import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Diagram, (diagram) => diagram.owner)
  diagrams: Diagram[];

  @OneToMany(() => DiagramCollaborator, (collaborator) => collaborator.user)
  collaborations: DiagramCollaborator[];
}
