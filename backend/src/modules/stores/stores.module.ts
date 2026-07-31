import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { Business } from '../businesses/entities/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Business])],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService, TypeOrmModule],
})
export class StoresModule {}
