import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Shop } from '../modules/shops/entities/shop.entity';
import { District } from '../modules/locations/entities/district.entity';
import { City } from '../modules/locations/entities/city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Shop, District, City])],
  providers: [SeedService],
})
export class SeedModule {}
