import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Offer } from './entities/offer.entity';
import { OfferImage } from './entities/offer-image.entity';
import { Shop } from '../shops/entities/shop.entity';
import { CreateOfferDto, UpdateOfferDto, OfferQueryDto } from './dto/offer.dto';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { UserRole } from '../../common/enums/role.enum';
import { paginate } from '../../common/dto/pagination.dto';
import { Analytics } from '../analytics/entities/analytics.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferImage)
    private readonly offerImageRepo: Repository<OfferImage>,
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    @InjectRepository(Analytics)
    private readonly analyticsRepo: Repository<Analytics>,
  ) {}

  async create(dto: CreateOfferDto, actorId: string, role: string) {
    let shopId = dto.shopId || dto.businessId;
    if (role === UserRole.BUSINESS_OWNER) {
      const shop = await this.shopRepo.findOne({
        where: { ownerId: actorId, isDeleted: false },
        order: { createdDate: 'ASC' },
      });
      if (!shop) throw new BadRequestException('No shop linked to this account');
      shopId = shop.id;
    }
    if (!shopId) throw new BadRequestException('shopId is required');

    const offer = this.offerRepo.create({
      title: dto.title,
      description: dto.description || null,
      discountPercent: dto.discountPercent,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      couponCode: dto.couponCode || null,
      image: dto.image || null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      categoryId: dto.categoryId || null,
      cityId: dto.cityId || null,
      shopId,
      status: dto.status || OfferStatus.DRAFT,
      qrCode: `OFFER-${uuidv4()}`,
      views: 0,
      likes: 0,
      createdBy: actorId,
      isDeleted: false,
    });

    const saved = await this.offerRepo.save(offer);
    return this.findOne(saved.id);
  }

  async findAll(
    query: OfferQueryDto,
    publicOnly = false,
    actor?: { id: string; role: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.shop', 'shop')
      .leftJoinAndSelect('offer.category', 'category')
      .leftJoinAndSelect('offer.city', 'city')
      .leftJoinAndSelect('offer.images', 'images')
      .where('offer.isDeleted = :deleted', { deleted: false });

    if (publicOnly) {
      qb.andWhere('offer.status = :status', { status: OfferStatus.ACTIVE });
    } else if (query.status) {
      qb.andWhere('offer.status = :status', { status: query.status });
    }

    if (!publicOnly && actor?.role === UserRole.BUSINESS_OWNER) {
      const shops = await this.shopRepo.find({
        where: { ownerId: actor.id, isDeleted: false },
        select: ['id'],
      });
      if (!shops.length) {
        return paginate([], 0, page, limit);
      }
      qb.andWhere('offer.shopId IN (:...shopIds)', {
        shopIds: shops.map((s) => s.id),
      });
    }

    if (query.search) {
      qb.andWhere('(offer.title LIKE :search OR offer.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.categoryId) {
      qb.andWhere('offer.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.cityId) {
      qb.andWhere('offer.cityId = :cityId', { cityId: query.cityId });
    }
    const shopFilter = query.shopId || query.businessId;
    if (shopFilter) {
      qb.andWhere('offer.shopId = :shopId', { shopId: shopFilter });
    }

    qb.orderBy('offer.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const offer = await this.offerRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['shop', 'category', 'city', 'images'],
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async incrementView(id: string, userId?: string) {
    const offer = await this.findOne(id);
    offer.views += 1;
    await this.offerRepo.save(offer);
    await this.analyticsRepo.save(
      this.analyticsRepo.create({
        eventType: 'OFFER_VIEW',
        entityType: 'offer',
        entityId: id,
        userId: userId || null,
        businessId: offer.shopId,
        isDeleted: false,
      }),
    );
    return offer;
  }

  async update(id: string, dto: UpdateOfferDto, actorId: string, role: string) {
    const offer = await this.findOne(id);
    await this.assertOwnership(offer, actorId, role);

    if (dto.title !== undefined) offer.title = dto.title;
    if (dto.description !== undefined) offer.description = dto.description;
    if (dto.discountPercent !== undefined) offer.discountPercent = dto.discountPercent;
    if (dto.startDate !== undefined) offer.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) offer.endDate = new Date(dto.endDate);
    if (dto.couponCode !== undefined) offer.couponCode = dto.couponCode;
    if (dto.image !== undefined) offer.image = dto.image;
    if (dto.latitude !== undefined) offer.latitude = dto.latitude;
    if (dto.longitude !== undefined) offer.longitude = dto.longitude;
    if (dto.categoryId !== undefined) offer.categoryId = dto.categoryId;
    if (dto.cityId !== undefined) offer.cityId = dto.cityId;
    if (dto.status !== undefined) offer.status = dto.status;
    offer.updatedBy = actorId;

    await this.offerRepo.save(offer);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const offer = await this.findOne(id);
    await this.assertOwnership(offer, actorId, role);
    offer.isDeleted = true;
    offer.updatedBy = actorId;
    await this.offerRepo.save(offer);
    return { success: true };
  }

  async addImage(offerId: string, imageUrl: string, actorId: string, role: string) {
    const offer = await this.findOne(offerId);
    await this.assertOwnership(offer, actorId, role);

    await this.offerImageRepo.update(
      { offerId, isDeleted: false },
      { isPrimary: false },
    );

    const image = this.offerImageRepo.create({
      offerId,
      imageUrl,
      isPrimary: true,
      createdBy: actorId,
      isDeleted: false,
    });
    offer.image = imageUrl;
    offer.updatedBy = actorId;
    await this.offerRepo.save(offer);
    return this.offerImageRepo.save(image);
  }

  private async assertOwnership(offer: Offer, actorId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    const shop = await this.shopRepo.findOne({
      where: { id: offer.shopId, isDeleted: false },
    });
    if (!shop || shop.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to modify this offer');
    }
  }
}
