import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { ListingStatus } from '../../../common/enums/listing-status.enum';
import { PriceUnit } from '../../../common/enums/price-unit.enum';
import { Shop } from '../../shops/entities/shop.entity';
import { Category } from '../../categories/entities/category.entity';
import { City } from '../../locations/entities/city.entity';

@Entity('services')
export class ServiceListing extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number | null;

  @Column({
    name: 'price_unit',
    type: 'enum',
    enum: PriceUnit,
    default: PriceUnit.FIXED,
  })
  priceUnit: PriceUnit;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.DRAFT })
  status: ListingStatus;

  @Column({ name: 'shop_id', type: 'varchar', length: 36 })
  shopId: string;

  @ManyToOne(() => Shop, (shop) => shop.services)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ name: 'category_id', type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'city_id', type: 'varchar', length: 36, nullable: true })
  cityId: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;
}
