import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('ia_configs')
@Unique(['usuario_id'])
export class IAConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.ia_configs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  base_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  api_key: string | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
