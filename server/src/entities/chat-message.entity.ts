import type { ChatMessageStatus, ChatRole } from '@fin-ai/shared/chat';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { FamilyGroup } from './family-group.entity';
import { Usuario } from './usuario.entity';

@Entity('chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.chat_messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ type: 'int', nullable: true })
  group_id: number | null;

  @ManyToOne(() => FamilyGroup, (group) => group.chat_messages, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup> | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  author_type: 'user' | 'agent';

  @Column({ type: 'int', nullable: true })
  author_usuario_id: number | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.authored_chat_messages, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'author_usuario_id' })
  author_usuario: Relation<Usuario> | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  agent_id: string | null;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'varchar', length: 20 })
  role: ChatRole;

  @Column({ type: 'varchar', length: 20 })
  status: ChatMessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    type: string;
    mime_type: string;
    data?: string;
    url?: string;
    name?: string;
    size?: number;
  }> | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  mentions: string[];

  @Column({ type: 'text', nullable: true })
  jarvis_content: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

export { ChatMessageEntity as ChatMessage };
