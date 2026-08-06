import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceListing } from './entities/service-listing.entity';
import { Shop } from '../shops/entities/shop.entity';
import { CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from './dto/service.dto';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { PriceUnit } from '../../common/enums/price-unit.enum';
import { UserRole } from '../../common/enums/role.enum';
import { ShopStatus } from '../../common/enums/shop-status.enum';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceListing)
    private readonly serviceRepo: Repository<ServiceListing>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
  ) {}

  async create(dto: CreateServiceDto, actorId: string, role: string) {
    const shopId = await this.resolveShopId(dto.shopId || dto.businessId, actorId, role);

    const listing = this.serviceRepo.create({
      title: dto.title,
      description: dto.description || null,
      price: dto.price != null ? Number(dto.price) : null,
      priceUnit: dto.priceUnit || PriceUnit.FIXED,
      image: dto.image || null,
      categoryId: dto.categoryId || null,
      cityId: dto.cityId || null,
      shopId,
      status: dto.status || ListingStatus.DRAFT,
      createdBy: actorId,
      isDeleted: false,
    });

    const saved = await this.serviceRepo.save(listing);
    return this.findOne(saved.id);
  }

  async findAll(
    query: ServiceQueryDto,
    publicOnly = false,
    actor?: { id: string; role: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.serviceRepo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.shop', 'shop')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.city', 'city')
      .where('service.isDeleted = :deleted', { deleted: false });

    if (publicOnly) {
      qb.andWhere('service.status = :status', { status: ListingStatus.ACTIVE });
      qb.andWhere('shop.status = :shopStatus', { shopStatus: ShopStatus.APPROVED });
      qb.andWhere('shop.isActive = :active', { active: true });
      qb.andWhere('shop.isDeleted = :shopDeleted', { shopDeleted: false });
    } else if (query.status) {
      qb.andWhere('service.status = :status', { status: query.status });
    }

    if (!publicOnly && actor?.role === UserRole.BUSINESS_OWNER) {
      const shops = await this.shopRepo.find({
        where: { ownerId: actor.id, isDeleted: false },
        select: ['id'],
      });
      if (!shops.length) {
        return paginate([], 0, page, limit);
      }
      qb.andWhere('service.shopId IN (:...shopIds)', {
        shopIds: shops.map((s) => s.id),
      });
    }

    if (query.search) {
      qb.andWhere('(service.title LIKE :search OR service.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.categoryId) {
      qb.andWhere('service.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.cityId) {
      qb.andWhere('service.cityId = :cityId', { cityId: query.cityId });
    }
    const shopFilter = query.shopId || query.businessId;
    if (shopFilter) {
      qb.andWhere('service.shopId = :shopId', { shopId: shopFilter });
    }

    qb.orderBy('service.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const listing = await this.serviceRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['shop', 'category', 'city'],
    });
    if (!listing) throw new NotFoundException('Service not found');
    return listing;
  }

  async update(id: string, dto: UpdateServiceDto, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);

    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price != null ? Number(dto.price) : null;
    if (dto.priceUnit !== undefined) listing.priceUnit = dto.priceUnit;
    if (dto.image !== undefined) listing.image = dto.image;
    if (dto.categoryId !== undefined) listing.categoryId = dto.categoryId;
    if (dto.cityId !== undefined) listing.cityId = dto.cityId;
    if (dto.status !== undefined) listing.status = dto.status;
    listing.updatedBy = actorId;

    await this.serviceRepo.save(listing);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);
    listing.isDeleted = true;
    listing.updatedBy = actorId;
    await this.serviceRepo.save(listing);
    return { success: true };
  }

  async addImage(id: string, imageUrl: string, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);
    listing.image = imageUrl;
    listing.updatedBy = actorId;
    await this.serviceRepo.save(listing);
    return this.findOne(id);
  }

  private async resolveShopId(
    requestedShopId: string | undefined,
    actorId: string,
    role: string,
  ): Promise<string> {
    let shopId = requestedShopId;
    if (role === UserRole.BUSINESS_OWNER) {
      const shop = await this.shopRepo.findOne({
        where: { ownerId: actorId, isDeleted: false },
        order: { createdDate: 'ASC' },
      });
      if (!shop) throw new BadRequestException('No shop linked to this account');
      shopId = shop.id;
    }
    if (!shopId) throw new BadRequestException('shopId is required');
    return shopId;
  }

  private async assertOwnership(
    listing: ServiceListing,
    actorId: string,
    role: string,
  ) {
    if (role === UserRole.ADMIN) return;
    const shop = await this.shopRepo.findOne({
      where: { id: listing.shopId, isDeleted: false },
    });
    if (!shop || shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to modify this service');
    }
  }
}
