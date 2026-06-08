import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import {
  CATEGORIA_VALUES,
  type CategoriaValue,
} from '../lancamentos/categoria.values';
import { FamilyGroup } from './family-group.entity';
import { Usuario } from './usuario.entity';

@Entity('lancamentos')
export class Lancamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  descricao: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  valor: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  data: string;

  @Column({
    type: 'enum',
    enum: CATEGORIA_VALUES,
  })
  categoria: CategoriaValue;

  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.lancamentos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ type: 'int', nullable: true })
  group_id: number | null;

  @ManyToOne(() => FamilyGroup, (group) => group.lancamentos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup> | null;

  @Column({ type: 'int', nullable: true })
  created_by_usuario_id: number | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.created_lancamentos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by_usuario_id' })
  created_by_usuario: Relation<Usuario> | null;

  @Column({ type: 'int', nullable: true })
  requested_by_usuario_id: number | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.requested_lancamentos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'requested_by_usuario_id' })
  requested_by_usuario: Relation<Usuario> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
