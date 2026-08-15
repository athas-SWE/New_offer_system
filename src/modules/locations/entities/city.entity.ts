import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { District } from './district.entity';

@Entity('cities')
export class City extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 140, unique: true })
  slug: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'district_id', type: 'varchar', length: 36 })
  districtId: string;

  @ManyToOne(() => District, (district) => district.cities)
  @JoinColumn({ name: 'district_id' })
  district: District;
}
