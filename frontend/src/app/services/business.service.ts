import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardOfferRow } from '../models';

export interface BusinessProfile {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  stores?: Array<{ id: string; name: string; address?: string | null; phone?: string | null }>;
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface CreateOfferPayload {
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  couponCode?: string;
  status?: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'INACTIVE';
}

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly api = inject(ApiService);

  getMine(): Observable<BusinessProfile> {
    return this.api.get<BusinessProfile>('/businesses/mine');
  }

  createStore(payload: CreateStorePayload): Observable<unknown> {
    return this.api.post('/stores', payload);
  }

  createOffer(payload: CreateOfferPayload): Observable<{ id: string; title: string; status: string }> {
    return this.api.post('/offers', payload);
  }

  getManagedOffers(): Observable<DashboardOfferRow[]> {
    return this.api.get<Paginated<Record<string, unknown>>>('/offers/manage').pipe(
      map((res) =>
        (res.data || []).map((o) => ({
          id: String(o['id']),
          title: String(o['title'] || ''),
          status: String(o['status'] || '').toLowerCase(),
          views: Number(o['views'] || 0),
          saves: 0,
          likes: Number(o['likes'] || 0),
          endsAt: String(o['endDate'] || o['end_date'] || new Date().toISOString()),
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
}
