import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { Shop } from '../shops/entities/shop.entity';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto } from './dto/rental.dto';
import { ListingStatus } from '../../common/enums/listing-status.enum';
import { PriceUnit } from '../../common/enums/price-unit.enum';
import { UserRole } from '../../common/enums/role.enum';
import { ShopStatus } from '../../common/enums/shop-status.enum';
import { paginate } from '../../common/dto/pagination.dto';
import { FacebookService } from '../facebook/facebook.service';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepo: Repository<Rental>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly facebook: FacebookService,
  ) {}

  async create(dto: CreateRentalDto, actorId: string, role: string) {
    const shopId = await this.resolveShopId(dto.shopId || dto.businessId, actorId, role);

    const listing = this.rentalRepo.create({
      title: dto.title,
      description: dto.description || null,
      price: dto.price != null ? Number(dto.price) : null,
      priceUnit: dto.priceUnit || PriceUnit.PER_DAY,
      deposit: dto.deposit != null ? Number(dto.deposit) : null,
      availabilityNote: dto.availabilityNote || null,
      image: dto.image || null,
      categoryId: dto.categoryId || null,
      cityId: dto.cityId || null,
      shopId,
      status: dto.status || ListingStatus.DRAFT,
      createdBy: actorId,
      isDeleted: false,
    });

    const saved = await this.rentalRepo.save(listing);
    return this.findOne(saved.id);
  }

  async findAll(
    query: RentalQueryDto,
    publicOnly = false,
    actor?: { id: string; role: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.rentalRepo
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.shop', 'shop')
      .leftJoinAndSelect('rental.category', 'category')
      .leftJoinAndSelect('rental.city', 'city')
      .where('rental.isDeleted = :deleted', { deleted: false });

    if (publicOnly) {
      qb.andWhere('rental.status = :status', { status: ListingStatus.ACTIVE });
      qb.andWhere('shop.status = :shopStatus', { shopStatus: ShopStatus.APPROVED });
      qb.andWhere('shop.isActive = :active', { active: true });
      qb.andWhere('shop.isDeleted = :shopDeleted', { shopDeleted: false });
    } else if (query.status) {
      qb.andWhere('rental.status = :status', { status: query.status });
    }

    if (!publicOnly && actor?.role === UserRole.BUSINESS_OWNER) {
      const shops = await this.shopRepo.find({
        where: { ownerId: actor.id, isDeleted: false },
        select: ['id'],
      });
      if (!shops.length) {
        return paginate([], 0, page, limit);
      }
      qb.andWhere('rental.shopId IN (:...shopIds)', {
        shopIds: shops.map((s) => s.id),
      });
    }

    if (query.search) {
      qb.andWhere('(rental.title LIKE :search OR rental.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.categoryId) {
      qb.andWhere('rental.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.cityId) {
      qb.andWhere('rental.cityId = :cityId', { cityId: query.cityId });
    }
    const shopFilter = query.shopId || query.businessId;
    if (shopFilter) {
      qb.andWhere('rental.shopId = :shopId', { shopId: shopFilter });
    }

    qb.orderBy('rental.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const listing = await this.rentalRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['shop', 'category', 'city'],
    });
    if (!listing) throw new NotFoundException('Rental not found');
    return listing;
  }

  async update(id: string, dto: UpdateRentalDto, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);

    if (dto.title !== undefined) listing.title = dto.title;
    if (dto.description !== undefined) listing.description = dto.description;
    if (dto.price !== undefined) listing.price = dto.price != null ? Number(dto.price) : null;
    if (dto.priceUnit !== undefined) listing.priceUnit = dto.priceUnit;
    if (dto.deposit !== undefined) {
      listing.deposit = dto.deposit != null ? Number(dto.deposit) : null;
    }
    if (dto.availabilityNote !== undefined) {
      listing.availabilityNote = dto.availabilityNote;
    }
    if (dto.image !== undefined) listing.image = dto.image;
    if (dto.categoryId !== undefined) listing.categoryId = dto.categoryId;
    if (dto.cityId !== undefined) listing.cityId = dto.cityId;
    if (dto.status !== undefined) listing.status = dto.status;
    listing.updatedBy = actorId;

    await this.rentalRepo.save(listing);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);
    listing.isDeleted = true;
    listing.updatedBy = actorId;
    await this.rentalRepo.save(listing);
    return { success: true };
  }

  async addImage(id: string, imageUrl: string, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);
    listing.image = imageUrl;
    listing.updatedBy = actorId;
    await this.rentalRepo.save(listing);
    return this.findOne(id);
  }

  async postToFacebook(id: string, actorId: string, role: string) {
    const listing = await this.findOne(id);
    await this.assertOwnership(listing, actorId, role);

    const shop = await this.shopRepo
      .createQueryBuilder('shop')
      .addSelect('shop.facebookPageAccessToken')
      .where('shop.id = :id', { id: listing.shopId })
      .andWhere('shop.isDeleted = :deleted', { deleted: false })
      .getOne();
    if (!shop) {
      throw new BadRequestException('Shop not found for this rental');
    }

    const link = `${this.facebook.getPublicSiteUrl()}/rentals/${listing.id}`;
    let priceLine: string | null = null;
    if (listing.price != null) {
      const unit =
        listing.priceUnit === PriceUnit.PER_DAY
          ? '/day'
          : listing.priceUnit === PriceUnit.HOURLY || listing.priceUnit === PriceUnit.PER_HOUR
            ? '/hour'
            : '';
      priceLine = `LKR ${Number(listing.price).toLocaleString('en-LK')}${unit}`;
    }

    return this.facebook.publishListing({
      shop,
      kind: 'rental',
      title: listing.title,
      description: listing.description,
      priceLine,
      link,
      imageUrl: listing.image,
    });
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

  private async assertOwnership(listing: Rental, actorId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    const shop = await this.shopRepo.findOne({
      where: { id: listing.shopId, isDeleted: false },
    });
    if (!shop || shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to modify this rental');
    }
  }
}
