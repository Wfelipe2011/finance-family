import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { FamilyGroup } from './family-group.entity';
import { Usuario } from './usuario.entity';

@Entity('jarvis_finance_drafts')
export class JarvisFinanceDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int' })
  group_id: number;

  @ManyToOne(() => FamilyGroup, (group) => group.jarvis_finance_drafts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup>;

  @Column({ type: 'int' })
  requester_usuario_id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.requested_jarvis_finance_drafts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_usuario_id' })
  requester: Relation<Usuario>;

  @Column({ type: 'uuid', nullable: true })
  source_message_id: string | null;

  @ManyToOne(() => ChatMessage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_message_id' })
  source_message: Relation<ChatMessage> | null;

  @Column({ type: 'varchar', length: 40 })
  operation: 'create' | 'edit' | 'delete';

  @Column({ type: 'jsonb' })
  payload: unknown;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'confirmed' | 'rejected';

  @Column({ type: 'int', nullable: true })
  resolved_by_usuario_id: number | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_usuario_id' })
  resolved_by: Relation<Usuario> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
