import { Entity, Column, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { City } from './city.entity';

@Entity('districts')
export class District extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 140, unique: true })
  slug: string;

  @Column({ name: 'province', type: 'varchar', length: 120, nullable: true })
  province: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => City, (city) => city.district)
  cities: City[];
}
