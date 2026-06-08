import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AvatarAsset } from './avatar-asset.entity';
import { FamilyGroup } from './family-group.entity';

@Entity('family_group_settings')
export class FamilyGroupSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  group_id: number;

  @OneToOne(() => FamilyGroup, (group) => group.settings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup>;

  @Column({ type: 'boolean', default: false })
  jarvis_always_on: boolean;

  @Column({ type: 'int', nullable: true })
  jarvis_avatar_asset_id: number | null;

  @OneToOne(() => AvatarAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jarvis_avatar_asset_id' })
  jarvis_avatar_asset: Relation<AvatarAsset> | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
