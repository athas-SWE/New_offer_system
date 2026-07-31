import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { OfferStatus } from '../../../common/enums/offer-status.enum';
import { Business } from '../../businesses/entities/business.entity';
import { Category } from '../../categories/entities/category.entity';
import { City } from '../../locations/entities/city.entity';
import { OfferImage } from './offer-image.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('offers')
export class Offer extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 250 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'discount_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercent: number;

  @Column({ name: 'start_date', type: 'datetime' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'datetime' })
  endDate: Date;

  @Column({ name: 'coupon_code', type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'qr_code', type: 'varchar', length: 500, nullable: true })
  qrCode: string | null;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.DRAFT })
  status: OfferStatus;

  @Column({ name: 'business_id', type: 'varchar', length: 36 })
  businessId: string;

  @ManyToOne(() => Business, (business) => business.offers)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'category_id', type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, (category) => category.offers, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'city_id', type: 'varchar', length: 36, nullable: true })
  cityId: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @OneToMany(() => OfferImage, (image) => image.offer, { cascade: true })
  images: OfferImage[];

  @OneToMany(() => Favorite, (favorite) => favorite.offer)
  favorites: Favorite[];

  @OneToMany(() => Review, (review) => review.offer)
  reviews: Review[];
}
