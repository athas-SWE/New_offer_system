import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Offer } from '../offers/entities/offer.entity';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './dto/review.dto';
import { UserRole } from '../../common/enums/role.enum';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const offer = await this.offerRepo.findOne({
      where: { id: dto.offerId, isDeleted: false },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const review = this.reviewRepo.create({
      userId,
      offerId: dto.offerId,
      rating: dto.rating,
      comment: dto.comment || null,
      isApproved: true,
      createdBy: userId,
      isDeleted: false,
    });
    return this.reviewRepo.save(review);
  }

  async findAll(query: ReviewQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.offer', 'offer')
      .where('review.is_deleted = :deleted', { deleted: false })
      .andWhere('review.is_approved = :approved', { approved: true });

    if (query.offerId) {
      qb.andWhere('review.offer_id = :offerId', { offerId: query.offerId });
    }

    qb.orderBy('review.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const review = await this.reviewRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'offer'],
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(id: string, dto: UpdateReviewDto, actorId: string, role: string) {
    const review = await this.findOne(id);
    if (role !== UserRole.ADMIN && review.userId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    Object.assign(review, { ...dto, updatedBy: actorId });
    await this.reviewRepo.save(review);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string, role: string) {
    const review = await this.findOne(id);
    if (role !== UserRole.ADMIN && review.userId !== actorId) {
      throw new ForbiddenException('Not allowed');
    }
    review.isDeleted = true;
    review.updatedBy = actorId;
    await this.reviewRepo.save(review);
    return { success: true };
  }
}
