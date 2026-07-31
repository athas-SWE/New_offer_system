import { Entity, Column, OneToOne, JoinColumn, OneToMany, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { BusinessStatus } from '../../../common/enums/business-status.enum';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { City } from '../../locations/entities/city.entity';

@Entity('businesses')
export class Business extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'enum', enum: BusinessStatus, default: BusinessStatus.PENDING })
  status: BusinessStatus;

  @Column({ name: 'owner_id', type: 'varchar', length: 36, unique: true })
  ownerId: string;

  @OneToOne(() => User, (user) => user.business)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'city_id', type: 'varchar', length: 36, nullable: true })
  cityId: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @OneToMany(() => Store, (store) => store.business)
  stores: Store[];

  @OneToMany(() => Offer, (offer) => offer.business)
  offers: Offer[];
}
