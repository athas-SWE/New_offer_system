import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { PosProduct } from './entities/pos-product.entity';
import { PosSale } from './entities/pos-sale.entity';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { Shop } from '../shops/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PosProduct, PosSale, PosSaleItem, Shop])],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService, TypeOrmModule],
})
export class PosModule {}
