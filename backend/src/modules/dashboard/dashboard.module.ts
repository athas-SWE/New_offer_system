import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Store } from '../stores/entities/store.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Business, Offer, Store, Review])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
