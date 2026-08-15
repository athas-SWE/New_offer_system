import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Shop } from '../../shops/entities/shop.entity';

@Entity('pos_products')
export class PosProduct extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  /** null = unlimited / not tracked */
  @Column({ type: 'int', nullable: true })
  stock: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'shop_id', type: 'varchar', length: 36 })
  shopId: string;

  @ManyToOne(() => Shop, (shop) => shop.posProducts)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
