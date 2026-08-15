import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { PosSale } from './pos-sale.entity';
import { PosProduct } from './pos-product.entity';

@Entity('pos_sale_items')
export class PosSaleItem extends BaseAuditEntity {
  @Column({ name: 'sale_id', type: 'varchar', length: 36 })
  saleId: string;

  @ManyToOne(() => PosSale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: PosSale;

  @Column({ name: 'product_id', type: 'varchar', length: 36, nullable: true })
  productId: string | null;

  @ManyToOne(() => PosProduct, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: PosProduct | null;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'line_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  lineTotal: number;
}
