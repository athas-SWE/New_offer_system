import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';

@Entity('favorites')
@Unique(['userId', 'offerId'])
export class Favorite extends BaseAuditEntity {
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'offer_id', type: 'varchar', length: 36 })
  offerId: string;

  @ManyToOne(() => Offer, (offer) => offer.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;
}
