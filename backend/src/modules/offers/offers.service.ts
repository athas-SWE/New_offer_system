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
import { Business } from '../businesses/entities/business.entity';
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
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Analytics)
    private readonly analyticsRepo: Repository<Analytics>,
  ) {}

  async create(dto: CreateOfferDto, actorId: string, role: string) {
    let businessId = dto.businessId;
    if (role === UserRole.BUSINESS_OWNER) {
      const business = await this.businessRepo.findOne({
        where: { ownerId: actorId, isDeleted: false },
      });
      if (!business) throw new BadRequestException('No business linked to this account');
      businessId = business.id;
    }
    if (!businessId) throw new BadRequestException('businessId is required');

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
      businessId,
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

  async findAll(query: OfferQueryDto, publicOnly = false) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.business', 'business')
      .leftJoinAndSelect('offer.category', 'category')
      .leftJoinAndSelect('offer.city', 'city')
      .leftJoinAndSelect('offer.images', 'images')
      .where('offer.is_deleted = :deleted', { deleted: false });

    if (publicOnly) {
      qb.andWhere('offer.status = :status', { status: OfferStatus.ACTIVE });
    } else if (query.status) {
      qb.andWhere('offer.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(offer.title LIKE :search OR offer.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.categoryId) {
      qb.andWhere('offer.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.cityId) {
      qb.andWhere('offer.city_id = :cityId', { cityId: query.cityId });
    }
    if (query.businessId) {
      qb.andWhere('offer.business_id = :businessId', { businessId: query.businessId });
    }

    qb.orderBy('offer.created_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const offer = await this.offerRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['business', 'category', 'city', 'images'],
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
        businessId: offer.businessId,
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
    const image = this.offerImageRepo.create({
      offerId,
      imageUrl,
      isPrimary: !offer.image,
      createdBy: actorId,
      isDeleted: false,
    });
    if (!offer.image) {
      offer.image = imageUrl;
      await this.offerRepo.save(offer);
    }
    return this.offerImageRepo.save(image);
  }

  private async assertOwnership(offer: Offer, actorId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    const business = await this.businessRepo.findOne({
      where: { id: offer.businessId, isDeleted: false },
    });
    if (!business || business.ownerId !== actorId) {
      throw new ForbiddenException('Not allowed to modify this offer');
    }
  }
}
