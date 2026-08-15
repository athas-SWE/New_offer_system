import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Shop } from '../shops/entities/shop.entity';
import { Offer } from '../offers/entities/offer.entity';
import { Review } from '../reviews/entities/review.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { OfferStatus } from '../../common/enums/offer-status.enum';
import { ShopStatus } from '../../common/enums/shop-status.enum';
import { UserRole } from '../../common/enums/role.enum';

export interface DashboardOfferRowDto {
  id: string;
  title: string;
  status: string;
  views: number;
  saves: number;
  likes: number;
  endsAt: string;
  businessName?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Shop) private readonly shopRepo: Repository<Shop>,
    @InjectRepository(Offer) private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  private mapOfferRow(
    offer: Offer,
    saves = 0,
    businessName?: string,
  ): DashboardOfferRowDto {
    return {
      id: offer.id,
      title: offer.title,
      status: (offer.status || '').toLowerCase(),
      views: offer.views || 0,
      saves,
      likes: offer.likes || 0,
      endsAt: offer.endDate
        ? new Date(offer.endDate).toISOString()
        : new Date().toISOString(),
      businessName,
    };
  }

  private async countSavesForOffers(offerIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!offerIds.length) return map;

    const rows = await this.favoriteRepo
      .createQueryBuilder('f')
      .select('f.offer_id', 'offerId')
      .addSelect('COUNT(*)', 'count')
      .where('f.offer_id IN (:...offerIds)', { offerIds })
      .andWhere('f.is_deleted = false')
      .groupBy('f.offer_id')
      .getRawMany<{ offerId: string; count: string }>();

    for (const row of rows) {
      map.set(row.offerId, Number(row.count || 0));
    }
    return map;
  }

  async getAdminDashboard() {
    const [
      totalUsers,
      totalShops,
      pendingShops,
      totalOffers,
      activeOffers,
      pendingOffers,
      expiredOffers,
      totalReviews,
      totalFavorites,
      totalViews,
    ] = await Promise.all([
      this.userRepo.count({ where: { isDeleted: false } }),
      this.shopRepo.count({ where: { isDeleted: false } }),
      this.shopRepo.count({
        where: { isDeleted: false, status: ShopStatus.PENDING },
      }),
      this.offerRepo.count({ where: { isDeleted: false } }),
      this.offerRepo.count({
        where: { isDeleted: false, status: OfferStatus.ACTIVE },
      }),
      this.offerRepo.count({
        where: { isDeleted: false, status: OfferStatus.PENDING },
      }),
      this.offerRepo.count({
        where: { isDeleted: false, status: OfferStatus.EXPIRED },
      }),
      this.reviewRepo.count({ where: { isDeleted: false } }),
      this.favoriteRepo.count({ where: { isDeleted: false } }),
      this.offerRepo
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.views), 0)', 'sum')
        .where('o.is_deleted = false')
        .getRawOne()
        .then((r) => Number(r?.sum || 0)),
    ]);

    return {
      role: UserRole.ADMIN,
      totalOffers,
      activeOffers,
      expiredOffers,
      pendingOffers,
      totalViews,
      favorites: totalFavorites,
      stores: totalShops,
      users: totalUsers,
      businesses: totalShops,
      pendingBusinesses: pendingShops,
      reviews: totalReviews,
      totals: {
        users: totalUsers,
        businesses: totalShops,
        pendingBusinesses: pendingShops,
        offers: totalOffers,
        activeOffers,
        pendingOffers,
        expiredOffers,
        stores: totalShops,
        reviews: totalReviews,
        favorites: totalFavorites,
        views: totalViews,
      },
    };
  }

  async getAdminRecentOffers(): Promise<DashboardOfferRowDto[]> {
    const recentOffers = await this.offerRepo.find({
      where: { isDeleted: false },
      relations: ['shop'],
      order: { createdDate: 'DESC' },
      take: 10,
    });
    const savesMap = await this.countSavesForOffers(recentOffers.map((o) => o.id));
    return recentOffers.map((o) =>
      this.mapOfferRow(o, savesMap.get(o.id) || 0, o.shop?.name),
    );
  }

  async getBusinessDashboard(ownerId: string) {
    const shops = await this.shopRepo.find({
      where: { ownerId, isDeleted: false },
    });

    if (!shops.length) {
      return {
        role: UserRole.BUSINESS_OWNER,
        business: null,
        totalOffers: 0,
        activeOffers: 0,
        totalViews: 0,
        favorites: 0,
        revenue: 0,
        stores: 0,
        reviews: 0,
        likes: 0,
        totals: {
          offers: 0,
          activeOffers: 0,
          stores: 0,
          reviews: 0,
          views: 0,
          favorites: 0,
          likes: 0,
        },
        message: 'No shop registered yet. Create a shop to see analytics.',
      };
    }

    const shopIds = shops.map((s) => s.id);
    const [totalOffers, activeOffers, totalReviews, totalViews, totalLikes, favorites] =
      await Promise.all([
        this.offerRepo.count({
          where: { shopId: In(shopIds), isDeleted: false },
        }),
        this.offerRepo.count({
          where: {
            shopId: In(shopIds),
            isDeleted: false,
            status: OfferStatus.ACTIVE,
          },
        }),
        this.reviewRepo
          .createQueryBuilder('r')
          .innerJoin('r.offer', 'o')
          .where('o.shop_id IN (:...shopIds)', { shopIds })
          .andWhere('r.is_deleted = false')
          .getCount(),
        this.offerRepo
          .createQueryBuilder('o')
          .select('COALESCE(SUM(o.views), 0)', 'sum')
          .where('o.shop_id IN (:...shopIds)', { shopIds })
          .andWhere('o.is_deleted = false')
          .getRawOne()
          .then((r) => Number(r?.sum || 0)),
        this.offerRepo
          .createQueryBuilder('o')
          .select('COALESCE(SUM(o.likes), 0)', 'sum')
          .where('o.shop_id IN (:...shopIds)', { shopIds })
          .andWhere('o.is_deleted = false')
          .getRawOne()
          .then((r) => Number(r?.sum || 0)),
        this.favoriteRepo
          .createQueryBuilder('f')
          .innerJoin('f.offer', 'o')
          .where('o.shop_id IN (:...shopIds)', { shopIds })
          .andWhere('f.is_deleted = false')
          .getCount(),
      ]);

    return {
      role: UserRole.BUSINESS_OWNER,
      business: shops[0],
      totalOffers,
      activeOffers,
      totalViews,
      favorites,
      likes: totalLikes,
      revenue: 0,
      stores: shops.length,
      reviews: totalReviews,
      totals: {
        offers: totalOffers,
        activeOffers,
        stores: shops.length,
        reviews: totalReviews,
        views: totalViews,
        favorites,
        likes: totalLikes,
      },
    };
  }

  async getBusinessOffers(ownerId: string): Promise<DashboardOfferRowDto[]> {
    const shops = await this.shopRepo.find({
      where: { ownerId, isDeleted: false },
      select: ['id'],
    });
    if (!shops.length) return [];

    const offers = await this.offerRepo.find({
      where: { shopId: In(shops.map((s) => s.id)), isDeleted: false },
      order: { createdDate: 'DESC' },
      take: 50,
    });
    const savesMap = await this.countSavesForOffers(offers.map((o) => o.id));
    return offers.map((o) => this.mapOfferRow(o, savesMap.get(o.id) || 0));
  }

  async getCustomerDashboard(userId: string) {
    const [favorites, unreadNotifications, reviews, activeOffers] =
      await Promise.all([
        this.favoriteRepo.count({ where: { userId, isDeleted: false } }),
        this.notificationRepo.count({
          where: { userId, isDeleted: false, isRead: false },
        }),
        this.reviewRepo.count({ where: { userId, isDeleted: false } }),
        this.offerRepo.count({
          where: { isDeleted: false, status: OfferStatus.ACTIVE },
        }),
      ]);

    const recentFavorites = await this.favoriteRepo.find({
      where: { userId, isDeleted: false },
      relations: ['offer', 'offer.shop'],
      order: { createdDate: 'DESC' },
      take: 8,
    });

    const endingSoon = await this.offerRepo
      .createQueryBuilder('o')
      .where('o.is_deleted = false')
      .andWhere('o.status = :status', { status: OfferStatus.ACTIVE })
      .andWhere('o.end_date >= NOW()')
      .orderBy('o.end_date', 'ASC')
      .take(6)
      .getMany();

    const savesMap = await this.countSavesForOffers(endingSoon.map((o) => o.id));

    return {
      role: UserRole.CUSTOMER,
      totalOffers: activeOffers,
      activeOffers,
      totalViews: 0,
      favorites,
      unreadNotifications,
      reviews,
      recentFavorites: recentFavorites
        .filter((f) => f.offer && !f.offer.isDeleted)
        .map((f) => this.mapOfferRow(f.offer, 0, f.offer.shop?.name)),
      endingSoon: endingSoon.map((o) =>
        this.mapOfferRow(o, savesMap.get(o.id) || 0),
      ),
      totals: {
        favorites,
        unreadNotifications,
        reviews,
        activeOffers,
      },
    };
  }

  async getDashboard(userId: string, role: string) {
    if (role === UserRole.ADMIN) {
      const [stats, recentOffers] = await Promise.all([
        this.getAdminDashboard(),
        this.getAdminRecentOffers(),
      ]);
      return { ...stats, recentOffers };
    }
    if (role === UserRole.BUSINESS_OWNER) {
      const [stats, recentOffers] = await Promise.all([
        this.getBusinessDashboard(userId),
        this.getBusinessOffers(userId),
      ]);
      return { ...stats, recentOffers };
    }
    return this.getCustomerDashboard(userId);
  }
}
