import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardOfferRow, DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getBusinessStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/dashboard/business').pipe(
      catchError(() =>
        of({
          totalOffers: 12,
          activeOffers: 8,
          totalViews: 4820,
          favorites: 316,
          revenue: 245000,
        })
      )
    );
  }

  getAdminStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/dashboard/admin').pipe(
      catchError(() =>
        of({
          totalOffers: 1284,
          activeOffers: 612,
          totalViews: 98240,
          favorites: 15420,
          stores: 186,
          users: 9420,
        })
      )
    );
  }

  getBusinessOffers(): Observable<DashboardOfferRow[]> {
    return this.api.get<DashboardOfferRow[]>('/dashboard/business/offers').pipe(
      catchError(() =>
        of<DashboardOfferRow[]>([
          { id: 'o1', title: 'Sunday Seafood Feast', status: 'active', views: 820, saves: 64, endsAt: '2026-08-31' },
          { id: 'o3', title: 'Island Fashion Drop', status: 'active', views: 540, saves: 41, endsAt: '2026-08-20' },
          { id: 'o7', title: 'Lunch Combo Draft', status: 'draft', views: 0, saves: 0, endsAt: '2026-09-01' },
          { id: 'o8', title: 'June Buffet', status: 'expired', views: 1200, saves: 90, endsAt: '2026-06-30' },
        ])
      )
    );
  }

  getAdminRecentOffers(): Observable<DashboardOfferRow[]> {
    return this.api.get<DashboardOfferRow[]>('/dashboard/admin/offers').pipe(
      catchError(() =>
        of<DashboardOfferRow[]>([
          { id: 'o1', title: 'Sunday Seafood Feast', status: 'active', views: 820, saves: 64, endsAt: '2026-08-31' },
          { id: 'o2', title: 'Monsoon Spa Escape', status: 'active', views: 610, saves: 88, endsAt: '2026-09-15' },
          { id: 'o4', title: 'Hill Country Staycation', status: 'active', views: 430, saves: 52, endsAt: '2026-10-01' },
          { id: 'o5', title: 'Tech Bundle Week', status: 'active', views: 390, saves: 27, endsAt: '2026-08-10' },
        ])
      )
    );
  }
}
