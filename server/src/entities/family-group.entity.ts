import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { AvatarAsset } from './avatar-asset.entity';
import { ChatMessage } from './chat-message.entity';
import { FamilyGroupMembership } from './family-group-membership.entity';
import { FamilyGroupSettings } from './family-group-settings.entity';
import { JarvisFinanceDraft } from './jarvis-finance-draft.entity';
import { Lancamento } from './lancamento.entity';

@Entity('family_groups')
export class FamilyGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => FamilyGroupMembership, (membership) => membership.group)
  memberships: Relation<FamilyGroupMembership[]>;

  @OneToOne(() => FamilyGroupSettings, (settings) => settings.group)
  settings: Relation<FamilyGroupSettings>;

  @OneToMany(() => ChatMessage, (message) => message.group)
  chat_messages: Relation<ChatMessage[]>;

  @OneToMany(() => Lancamento, (lancamento) => lancamento.group)
  lancamentos: Relation<Lancamento[]>;

  @OneToMany(() => AvatarAsset, (avatar) => avatar.group)
  avatar_assets: Relation<AvatarAsset[]>;

  @OneToMany(() => JarvisFinanceDraft, (draft) => draft.group)
  jarvis_finance_drafts: Relation<JarvisFinanceDraft[]>;
}
