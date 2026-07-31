import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Store } from '../stores/entities/store.entity';
import { Review } from '../reviews/entities/review.entity';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { BusinessStatus } from '../../common/enums/business-status.enum';
import { UserRole } from '../../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async getAdminDashboard() {
    const [
      totalUsers,
      totalBusinesses,
      pendingBusinesses,
      totalOffers,
      activeOffers,
      totalStores,
      totalReviews,
      totalViews,
    ] = await Promise.all([
      this.userRepo.count({ where: { isDeleted: false } }),
      this.businessRepo.count({ where: { isDeleted: false } }),
      this.businessRepo.count({
        where: { isDeleted: false, status: BusinessStatus.PENDING },
      }),
      this.offerRepo.count({ where: { isDeleted: false } }),
      this.offerRepo.count({
        where: { isDeleted: false, status: OfferStatus.ACTIVE },
      }),
      this.storeRepo.count({ where: { isDeleted: false } }),
      this.reviewRepo.count({ where: { isDeleted: false } }),
      this.offerRepo
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.views), 0)', 'sum')
        .where('o.is_deleted = false')
        .getRawOne()
        .then((r) => Number(r?.sum || 0)),
    ]);

    const recentOffers = await this.offerRepo.find({
      where: { isDeleted: false },
      relations: ['business'],
      order: { createdDate: 'DESC' },
      take: 5,
    });

    return {
      totals: {
        users: totalUsers,
        businesses: totalBusinesses,
        pendingBusinesses,
        offers: totalOffers,
        activeOffers,
        stores: totalStores,
        reviews: totalReviews,
        views: totalViews,
      },
      recentOffers,
    };
  }

  async getBusinessDashboard(ownerId: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerId, isDeleted: false },
    });
    if (!business) {
      return { totals: {}, recentOffers: [] };
    }

    const [totalOffers, activeOffers, totalStores, totalReviews, totalViews] =
      await Promise.all([
        this.offerRepo.count({
          where: { businessId: business.id, isDeleted: false },
        }),
        this.offerRepo.count({
          where: {
            businessId: business.id,
            isDeleted: false,
            status: OfferStatus.ACTIVE,
          },
        }),
        this.storeRepo.count({
          where: { businessId: business.id, isDeleted: false },
        }),
        this.reviewRepo
          .createQueryBuilder('r')
          .innerJoin('r.offer', 'o')
          .where('o.business_id = :businessId', { businessId: business.id })
          .andWhere('r.is_deleted = false')
          .getCount(),
        this.offerRepo
          .createQueryBuilder('o')
          .select('COALESCE(SUM(o.views), 0)', 'sum')
          .where('o.business_id = :businessId', { businessId: business.id })
          .andWhere('o.is_deleted = false')
          .getRawOne()
          .then((r) => Number(r?.sum || 0)),
      ]);

    const recentOffers = await this.offerRepo.find({
      where: { businessId: business.id, isDeleted: false },
      order: { createdDate: 'DESC' },
      take: 5,
    });

    return {
      business,
      totals: {
        offers: totalOffers,
        activeOffers,
        stores: totalStores,
        reviews: totalReviews,
        views: totalViews,
      },
      recentOffers,
    };
  }

  async getDashboard(userId: string, role: string) {
    if (role === UserRole.ADMIN) {
      return this.getAdminDashboard();
    }
    if (role === UserRole.BUSINESS_OWNER) {
      return this.getBusinessDashboard(userId);
    }
    const favoritesCount = 0;
    return {
      totals: { favorites: favoritesCount },
      message: 'Customer dashboard',
    };
  }
}
