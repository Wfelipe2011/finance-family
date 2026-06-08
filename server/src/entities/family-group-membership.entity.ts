import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { FamilyGroup } from './family-group.entity';
import { Usuario } from './usuario.entity';

@Entity('family_group_memberships')
@Unique('UQ_family_group_membership_user_group', ['group_id', 'usuario_id'])
export class FamilyGroupMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  group_id: number;

  @ManyToOne(() => FamilyGroup, (group) => group.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Relation<FamilyGroup>;

  @Index()
  @Column({ type: 'int' })
  usuario_id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.family_group_memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role: 'member' | 'owner';

  @CreateDateColumn({ type: 'timestamp' })
  joined_at: Date;
}
