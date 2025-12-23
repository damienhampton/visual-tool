import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Diagram } from './diagram.entity';
import { User } from './user.entity';

export interface DiagramData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      description?: string;
      type: 'person' | 'softwareSystem' | 'container' | 'component';
      color?: string;
      metadata?: Record<string, any>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    animated?: boolean;
    style?: Record<string, any>;
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

@Entity('diagram_versions')
@Index(['diagramId', 'version'])
export class DiagramVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diagram_id' })
  @Index()
  diagramId: string;

  @ManyToOne(() => Diagram, (diagram) => diagram.versions)
  @JoinColumn({ name: 'diagram_id' })
  diagram: Diagram;

  @Column()
  version: number;

  @Column({ type: 'jsonb' })
  data: DiagramData;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
