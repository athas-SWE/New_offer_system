import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { Business } from '../businesses/entities/business.entity';
import { CreateStoreDto, UpdateStoreDto, StoreQueryDto } from './dto/store.dto';
import { UserRole } from '../../common/enums/role.enum';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
  ) {}

  async create(dto: CreateStoreDto, actorId: string, role: string) {
    const businessId = await this.resolveBusinessId(dto.businessId, actorId, role);
    const store = this.storeRepo.create({
      name: dto.name,
      description: dto.description || null,
      address: dto.address || null,
      phone: dto.phone || null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      cityId: dto.cityId || null,
      businessId,
      isActive: true,
      createdBy: actorId,
      isDeleted: false,
    });
    const saved = await this.storeRepo.save(store);
    return this.findOne(saved.id);
  }

  async findAll(query: StoreQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.storeRepo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.business', 'business')
      .leftJoinAndSelect('store.city', 'city')
      .where('store.is_deleted = :deleted', { deleted: false });

    if (query.search) {
      qb.andWhere('store.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.businessId) {
      qb.andWhere('store.business_id = :businessId', { businessId: query.businessId });
    }

    qb.orderBy('store.created_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const store = await this.storeRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['business', 'city'],
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(id: string, dto: UpdateStoreDto, actorId: string, role: string) {
    const store = await this.findOne(id);
    await this.assertOwnership(store.businessId, actorId, role);
    Object.assign(store, { ...dto, updatedBy: actorId });
    await this.storeRepo.save(store);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const store = await this.findOne(id);
    await this.assertOwnership(store.businessId, actorId, role);
    store.isDeleted = true;
    store.updatedBy = actorId;
    await this.storeRepo.save(store);
    return { success: true };
  }

  private async resolveBusinessId(
    businessId: string | undefined,
    actorId: string,
    role: string,
  ) {
    if (role === UserRole.BUSINESS_OWNER) {
      const business = await this.businessRepo.findOne({
        where: { ownerId: actorId, isDeleted: false },
      });
      if (!business) throw new BadRequestException('No business linked');
      return business.id;
    }
    if (!businessId) throw new BadRequestException('businessId is required');
    return businessId;
  }

  private async assertOwnership(businessId: string, actorId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    const business = await this.businessRepo.findOne({
      where: { id: businessId, isDeleted: false },
    });
    if (!business || business.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
  }
}
