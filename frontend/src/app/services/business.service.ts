import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map, switchMap, of, throwError, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardOfferRow } from '../models';
import { resolveAssetUrl } from '../utils/asset-url';

export interface ShopLocation {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  stores?: ShopLocation[];
  shops?: ShopLocation[];
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  cityId?: string;
}

export interface RegisterShopPayload {
  name: string;
  description?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  cityId?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
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

  registerShop(payload: RegisterShopPayload): Observable<{ id: string; name: string; status: string }> {
    return this.api
      .post<{ id: string; name: string; status: string }>('/shops/register', {
        ...payload,
        email: payload.email || payload.ownerEmail,
      })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(
            () =>
              new Error(
                (err.error as { message?: string })?.message || 'Shop registration failed',
              ),
          ),
        ),
      );
  }

  getMine(): Observable<BusinessProfile> {
    return this.api.get<BusinessProfile>('/shops/mine').pipe(
      map((shop) => {
        const locations = (shop.shops || shop.stores || [shop]).filter(Boolean) as ShopLocation[];
        return {
          ...shop,
          logoUrl: resolveAssetUrl(shop.logoUrl) || shop.logoUrl,
          stores: locations.map((s) => ({
            ...s,
            logoUrl: resolveAssetUrl(s.logoUrl) || s.logoUrl,
          })),
        };
      }),
    );
  }

  createStore(payload: CreateStorePayload): Observable<{ id: string }> {
    return this.api.post<{ id: string }>('/shops', payload);
  }

  uploadShopLogo(shopId: string, file: File): Observable<BusinessProfile> {
    return this.api.upload<BusinessProfile>(`/shops/${shopId}/logo`, file).pipe(
      map((shop) => ({
        ...shop,
        logoUrl: resolveAssetUrl(shop.logoUrl) || shop.logoUrl,
      })),
    );
  }

  createOffer(
    payload: CreateOfferPayload,
  ): Observable<{ id: string; title: string; status: string }> {
    return this.api.post('/offers', payload);
  }

  uploadOfferImage(offerId: string, file: File): Observable<unknown> {
    return this.api.upload(`/offers/${offerId}/images`, file);
  }

  createOfferWithImage(
    payload: CreateOfferPayload,
    image?: File | null,
  ): Observable<{ id: string; title: string; status: string }> {
    return this.createOffer(payload).pipe(
      switchMap((offer) => {
        if (!image) return of(offer);
        return this.uploadOfferImage(offer.id, image).pipe(map(() => offer));
      }),
    );
  }

  createStoreWithLogo(
    payload: CreateStorePayload,
    logo?: File | null,
  ): Observable<{ id: string }> {
    return this.createStore(payload).pipe(
      switchMap((shop) => {
        if (!logo) return of(shop);
        return this.uploadShopLogo(shop.id, logo).pipe(map(() => shop));
      }),
    );
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
          imageUrl: resolveAssetUrl(
            (o['image'] as string | undefined) ||
              ((o['images'] as Array<{ imageUrl?: string }> | undefined)?.[0]?.imageUrl),
          ),
        })),
      ),
    );
  }

  updateOfferStatus(id: string, status: string): Observable<unknown> {
    return this.api.put(`/offers/${id}`, { status: status.toUpperCase() });
  }

  deleteOffer(id: string): Observable<unknown> {
    return this.api.delete(`/offers/${id}`);
  }
}
