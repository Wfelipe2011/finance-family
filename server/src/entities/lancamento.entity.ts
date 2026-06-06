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

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
