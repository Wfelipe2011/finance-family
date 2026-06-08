import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Lancamento } from './lancamento.entity';
import { ChatMessage } from './chat-message.entity';
import { IAConfig } from './ia-config.entity';
import { FamilyGroupMembership } from './family-group-membership.entity';
import { JarvisFinanceDraft } from './jarvis-finance-draft.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => Lancamento, (lancamento) => lancamento.usuario)
  lancamentos: Relation<Lancamento[]>;

  @OneToMany(() => ChatMessage, (message) => message.usuario)
  chat_messages: Relation<ChatMessage[]>;

  @OneToMany(() => IAConfig, (config) => config.usuario)
  ia_configs: Relation<IAConfig[]>;

  @OneToMany(() => FamilyGroupMembership, (membership) => membership.usuario)
  family_group_memberships: Relation<FamilyGroupMembership[]>;

  @OneToMany(() => ChatMessage, (message) => message.author_usuario)
  authored_chat_messages: Relation<ChatMessage[]>;

  @OneToMany(() => Lancamento, (lancamento) => lancamento.created_by_usuario)
  created_lancamentos: Relation<Lancamento[]>;

  @OneToMany(() => Lancamento, (lancamento) => lancamento.requested_by_usuario)
  requested_lancamentos: Relation<Lancamento[]>;

  @OneToMany(() => JarvisFinanceDraft, (draft) => draft.requester)
  requested_jarvis_finance_drafts: Relation<JarvisFinanceDraft[]>;
}
