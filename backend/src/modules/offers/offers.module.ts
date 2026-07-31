import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './entities/offer.entity';
import { OfferImage } from './entities/offer-image.entity';
import { Business } from '../businesses/entities/business.entity';
import { Analytics } from '../analytics/entities/analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, OfferImage, Business, Analytics])],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService, TypeOrmModule],
})
export class OffersModule {}
