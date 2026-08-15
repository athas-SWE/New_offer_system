import { Entity, Column, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/role.enum';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role extends BaseAuditEntity {
  @Column({ type: 'enum', enum: UserRole, unique: true })
  name: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
