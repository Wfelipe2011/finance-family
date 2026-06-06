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

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'varchar', length: 20 })
  role: ChatRole;

  @Column({ type: 'varchar', length: 20 })
  status: ChatMessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{ type: string; mime_type: string; data?: string }> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

export { ChatMessageEntity as ChatMessage };
