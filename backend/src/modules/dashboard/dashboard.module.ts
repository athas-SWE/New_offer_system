import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Store } from '../stores/entities/store.entity';
import { Review } from '../reviews/entities/review.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Business,
      Offer,
      Store,
      Review,
      Favorite,
      Notification,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
