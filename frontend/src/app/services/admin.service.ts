import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardOfferRow } from '../models';

export interface AdminBusiness {
  id: string;
  name: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  owner?: { id: string; name: string; email: string };
  createdDate?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive?: boolean;
  role?: { name: string } | string;
  createdDate?: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  getBusinesses(status?: string): Observable<AdminBusiness[]> {
    return this.api
      .get<Paginated<AdminBusiness>>('/shops/manage', { status, limit: 50 })
      .pipe(map((res) => res.data || []));
  }

  updateBusinessStatus(id: string, status: string): Observable<AdminBusiness> {
    return this.api.put<AdminBusiness>(`/shops/${id}/status`, { status });
  }

  getManagedOffers(status?: string): Observable<DashboardOfferRow[]> {
    return this.api
      .get<Paginated<Record<string, unknown>>>('/offers/manage', { status, limit: 50 })
      .pipe(
        map((res) =>
          (res.data || []).map((o) => ({
            id: String(o['id']),
            title: String(o['title'] || ''),
            status: String(o['status'] || '').toLowerCase(),
            views: Number(o['views'] || 0),
            saves: 0,
            likes: Number(o['likes'] || 0),
            endsAt: String(o['endDate'] || new Date().toISOString()),
            businessName:
              (o['business'] as { name?: string } | undefined)?.name || undefined,
          }))
        )
      );
  }

  updateOfferStatus(id: string, status: string): Observable<unknown> {
    return this.api.put(`/offers/${id}`, { status: status.toUpperCase() });
  }

  deleteOffer(id: string): Observable<unknown> {
    return this.api.delete(`/offers/${id}`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.api
      .get<Paginated<AdminUser>>('/users', { limit: 50 })
      .pipe(map((res) => res.data || []));
  }

  getCategories(): Observable<AdminCategory[]> {
    return this.api.get<AdminCategory[] | Paginated<AdminCategory>>('/categories').pipe(
      map((res) => (Array.isArray(res) ? res : res.data || []))
    );
  }

  createCategory(payload: {
    name: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
  }): Observable<AdminCategory> {
    return this.api.post<AdminCategory>('/categories', payload);
  }

  deleteCategory(id: string): Observable<unknown> {
    return this.api.delete(`/categories/${id}`);
  }

  getHeroSlides(): Observable<HeroSlide[]> {
    return this.api.get<HeroSlide[]>('/hero-slides/manage');
  }

  createHeroSlide(payload: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    ctaLabel?: string;
    ctaLink?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Observable<HeroSlide> {
    return this.api.post<HeroSlide>('/hero-slides', payload);
  }

  updateHeroSlide(
    id: string,
    payload: Partial<{
      title: string;
      subtitle: string;
      imageUrl: string;
      ctaLabel: string;
      ctaLink: string;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Observable<HeroSlide> {
    return this.api.put<HeroSlide>(`/hero-slides/${id}`, payload);
  }

  deleteHeroSlide(id: string): Observable<unknown> {
    return this.api.delete(`/hero-slides/${id}`);
  }
}
