import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, User, Role])],
  controllers: [ShopsController],
  providers: [ShopsService],
  exports: [ShopsService, TypeOrmModule],
})
export class ShopsModule {}
