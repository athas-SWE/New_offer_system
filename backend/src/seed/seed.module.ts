import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Business } from '../modules/businesses/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Business])],
  providers: [SeedService],
})
export class SeedModule {}
