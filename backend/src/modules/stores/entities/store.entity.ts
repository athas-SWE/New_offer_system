import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { City } from '../../locations/entities/city.entity';

@Entity('stores')
export class Store extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'business_id', type: 'varchar', length: 36 })
  businessId: string;

  @ManyToOne(() => Business, (business) => business.stores)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'city_id', type: 'varchar', length: 36, nullable: true })
  cityId: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;
}
