import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { CustomerDashboard, DashboardOfferRow, DashboardStats } from '../models';

interface DashboardApiResponse extends Partial<DashboardStats> {
  totals?: Record<string, number>;
  recentFavorites?: DashboardOfferRow[];
  endingSoon?: DashboardOfferRow[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getBusinessStats(): Observable<DashboardStats> {
    return this.api.get<DashboardApiResponse>('/dashboard/business').pipe(
      map((res) => ({
        totalOffers: res.totalOffers ?? res.totals?.['offers'] ?? 0,
        activeOffers: res.activeOffers ?? res.totals?.['activeOffers'] ?? 0,
        totalViews: res.totalViews ?? res.totals?.['views'] ?? 0,
        favorites: res.favorites ?? res.totals?.['favorites'] ?? 0,
        revenue: res.revenue ?? 0,
        stores: res.stores ?? res.totals?.['stores'] ?? 0,
        reviews: res.reviews ?? res.totals?.['reviews'] ?? 0,
        likes: res.likes ?? res.totals?.['likes'] ?? 0,
        message: res.message,
        role: res.role,
      })),
      catchError((err) => throwError(() => err))
    );
  }

  getAdminStats(): Observable<DashboardStats> {
    return this.api.get<DashboardApiResponse>('/dashboard/admin').pipe(
      map((res) => ({
        totalOffers: res.totalOffers ?? res.totals?.['offers'] ?? 0,
        activeOffers: res.activeOffers ?? res.totals?.['activeOffers'] ?? 0,
        expiredOffers: res.expiredOffers ?? 0,
        pendingOffers: res.pendingOffers ?? 0,
        totalViews: res.totalViews ?? res.totals?.['views'] ?? 0,
        favorites: res.favorites ?? res.totals?.['favorites'] ?? 0,
        stores: res.stores ?? res.totals?.['stores'] ?? 0,
        users: res.users ?? res.totals?.['users'] ?? 0,
        businesses: res.businesses ?? res.totals?.['businesses'] ?? 0,
        pendingBusinesses:
          res.pendingBusinesses ?? res.totals?.['pendingBusinesses'] ?? 0,
        reviews: res.reviews ?? 0,
        role: res.role,
      })),
      catchError((err) => throwError(() => err))
    );
  }

  getBusinessOffers(): Observable<DashboardOfferRow[]> {
    return this.api.get<DashboardOfferRow[]>('/dashboard/business/offers').pipe(
      map((rows) => rows || []),
      catchError(() => of([]))
    );
  }

  getAdminRecentOffers(): Observable<DashboardOfferRow[]> {
    return this.api.get<DashboardOfferRow[]>('/dashboard/admin/offers').pipe(
      map((rows) => rows || []),
      catchError(() => of([]))
    );
  }

  getCustomerDashboard(): Observable<CustomerDashboard> {
    return this.api.get<DashboardApiResponse>('/dashboard/customer').pipe(
      map((res) => ({
        role: res.role,
        totalOffers: res.totalOffers ?? res.activeOffers ?? 0,
        activeOffers: res.activeOffers ?? 0,
        totalViews: 0,
        favorites: res.favorites ?? 0,
        unreadNotifications: res.unreadNotifications ?? 0,
        reviews: res.reviews ?? 0,
        recentFavorites: res.recentFavorites || [],
        endingSoon: res.endingSoon || [],
      })),
      catchError((err) => throwError(() => err))
    );
  }
}
