import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Shop } from '../modules/shops/entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Shop])],
  providers: [SeedService],
})
export class SeedModule {}
