import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServiceListing } from './entities/service-listing.entity';
import { Shop } from '../shops/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceListing, Shop])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, TypeOrmModule],
})
export class ServicesModule {}
