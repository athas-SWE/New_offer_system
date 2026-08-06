import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { ManagedListingRow, PaginatedResult, RentalListing } from '../models';
import { normalizePageMeta } from '../models/pagination.model';
import { resolveAssetUrl } from '../utils/asset-url';

interface ApiRentalRow {
  id: string;
  title: string;
  description?: string | null;
  price?: number | string | null;
  priceUnit?: string;
  deposit?: number | string | null;
  availabilityNote?: string | null;
  image?: string | null;
  status?: string;
  shopId?: string;
  shop?: {
    id?: string;
    name?: string;
    phone?: string | null;
  } | null;
  city?: { name?: string } | null;
  category?: { name?: string } | null;
}

interface Paginated<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateRentalPayload {
  title: string;
  description?: string;
  price?: number;
  priceUnit?: string;
  deposit?: number;
  availabilityNote?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class RentalsService {
  private readonly api = inject(ApiService);

  getRentals(params?: {
    search?: string;
    shopId?: string;
    cityId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Observable<RentalListing[]> {
    return this.getRentalsPage(params).pipe(map((res) => res.items));
  }

  getRentalsPage(params?: {
    search?: string;
    shopId?: string;
    cityId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResult<RentalListing>> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 12;
    return this.api
      .get<Paginated<ApiRentalRow> | ApiRentalRow[]>('/rentals', {
        ...params,
        page,
        limit,
      })
      .pipe(
        map((res) => {
          const rows = Array.isArray(res) ? res : res.data || [];
          const items = rows.map((row) => this.mapPublic(row));
          return {
            items,
            meta: normalizePageMeta(
              Array.isArray(res) ? null : res.meta,
              page,
              limit,
              items.length,
            ),
          };
        }),
        catchError(() =>
          of({ items: [], meta: normalizePageMeta(null, page, limit, 0) }),
        ),
      );
  }

  getRentalById(id: string): Observable<RentalListing | undefined> {
    return this.api.get<ApiRentalRow>(`/rentals/${id}`).pipe(
      map((row) => this.mapPublic(row)),
      catchError(() => of(undefined)),
    );
  }

  getManaged(): Observable<ManagedListingRow[]> {
    return this.api.get<Paginated<ApiRentalRow>>('/rentals/manage').pipe(
      map((res) => (res.data || []).map((row) => this.mapManaged(row))),
      catchError(() => of([])),
    );
  }

  create(payload: CreateRentalPayload): Observable<{ id: string; title: string; status: string }> {
    return this.api.post('/rentals', payload);
  }

  createWithImage(
    payload: CreateRentalPayload,
    image?: File | null,
  ): Observable<{ id: string; title: string; status: string }> {
    return this.create(payload).pipe(
      switchMap((created) => {
        if (!image) return of(created);
        return this.uploadImage(created.id, image).pipe(map(() => created));
      }),
    );
  }

  uploadImage(id: string, file: File): Observable<unknown> {
    return this.api.upload(`/rentals/${id}/image`, file);
  }

  updateStatus(id: string, status: string): Observable<unknown> {
    return this.api.put(`/rentals/${id}`, { status: status.toUpperCase() });
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete(`/rentals/${id}`);
  }

  private mapPublic(row: ApiRentalRow): RentalListing {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      price: row.price != null ? Number(row.price) : undefined,
      priceUnit: (row.priceUnit as RentalListing['priceUnit']) || 'PER_DAY',
      deposit: row.deposit != null ? Number(row.deposit) : undefined,
      availabilityNote: row.availabilityNote || undefined,
      imageUrl: resolveAssetUrl(row.image) || undefined,
      status: row.status || 'DRAFT',
      shopId: row.shopId || row.shop?.id || '',
      shopName: row.shop?.name,
      city: row.city?.name,
      categoryName: row.category?.name,
      phone: row.shop?.phone || undefined,
    };
  }

  private mapManaged(row: ApiRentalRow): ManagedListingRow {
    return {
      id: row.id,
      title: row.title,
      status: String(row.status || '').toLowerCase(),
      price: row.price != null ? Number(row.price) : undefined,
      priceUnit: row.priceUnit,
      imageUrl: resolveAssetUrl(row.image) || undefined,
      deposit: row.deposit != null ? Number(row.deposit) : undefined,
      availabilityNote: row.availabilityNote || undefined,
    };
  }
}
