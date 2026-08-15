import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { PosPaymentMethod } from '../../../common/enums/pos-payment-method.enum';
import { Shop } from '../../shops/entities/shop.entity';
import { PosSaleItem } from './pos-sale-item.entity';

@Entity('pos_sales')
export class PosSale extends BaseAuditEntity {
  @Column({ name: 'receipt_number', type: 'varchar', length: 40 })
  receiptNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PosPaymentMethod,
    default: PosPaymentMethod.CASH,
  })
  paymentMethod: PosPaymentMethod;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @Column({ name: 'shop_id', type: 'varchar', length: 36 })
  shopId: string;

  @ManyToOne(() => Shop, (shop) => shop.posSales)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @OneToMany(() => PosSaleItem, (item) => item.sale, { cascade: true })
  items: PosSaleItem[];
}
