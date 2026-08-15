import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { Rental } from './entities/rental.entity';
import { Shop } from '../shops/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, Shop])],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService, TypeOrmModule],
})
export class RentalsModule {}
