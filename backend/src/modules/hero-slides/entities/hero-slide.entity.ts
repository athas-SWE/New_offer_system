import { Entity, Column } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';

@Entity('hero_slides')
export class HeroSlide extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subtitle: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 700 })
  imageUrl: string;

  @Column({ name: 'cta_label', type: 'varchar', length: 80, nullable: true })
  ctaLabel: string | null;

  @Column({ name: 'cta_link', type: 'varchar', length: 300, nullable: true })
  ctaLink: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
