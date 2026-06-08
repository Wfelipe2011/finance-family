import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { FamilyGroup } from './family-group.entity';

@Entity('avatar_assets')
export class AvatarAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  owner_type: 'user' | 'agent';

  @Column({ type: 'varchar', length: 80 })
  owner_id: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  group_id: number | null;

  @ManyToOne(() => FamilyGroup, (group) => group.avatar_assets, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup> | null;

  @Column({ type: 'varchar', length: 500 })
  storage_path: string;

  @Column({ type: 'varchar', length: 500 })
  public_url: string;

  @Column({ type: 'varchar', length: 120 })
  mime_type: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
