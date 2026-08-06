import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { ManagedListingRow, PaginatedResult, ServiceListing } from '../models';
import { normalizePageMeta } from '../models/pagination.model';
import { resolveAssetUrl } from '../utils/asset-url';

interface ApiServiceRow {
  id: string;
  title: string;
  description?: string | null;
  price?: number | string | null;
  priceUnit?: string;
  image?: string | null;
  status?: string;
  shopId?: string;
  shop?: { id?: string; name?: string } | null;
  city?: { name?: string } | null;
  category?: { name?: string } | null;
}

interface Paginated<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateServicePayload {
  title: string;
  description?: string;
  price?: number;
  priceUnit?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ShopServicesService {
  private readonly api = inject(ApiService);

  getServices(params?: {
    search?: string;
    shopId?: string;
    cityId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Observable<ServiceListing[]> {
    return this.getServicesPage(params).pipe(map((res) => res.items));
  }

  getServicesPage(params?: {
    search?: string;
    shopId?: string;
    cityId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResult<ServiceListing>> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 12;
    return this.api
      .get<Paginated<ApiServiceRow> | ApiServiceRow[]>('/services', {
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

  getServiceById(id: string): Observable<ServiceListing | undefined> {
    return this.api.get<ApiServiceRow>(`/services/${id}`).pipe(
      map((row) => this.mapPublic(row)),
      catchError(() => of(undefined)),
    );
  }

  getManaged(): Observable<ManagedListingRow[]> {
    return this.api.get<Paginated<ApiServiceRow>>('/services/manage').pipe(
      map((res) => (res.data || []).map((row) => this.mapManaged(row))),
      catchError(() => of([])),
    );
  }

  create(payload: CreateServicePayload): Observable<{ id: string; title: string; status: string }> {
    return this.api.post('/services', payload);
  }

  createWithImage(
    payload: CreateServicePayload,
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
    return this.api.upload(`/services/${id}/image`, file);
  }

  updateStatus(id: string, status: string): Observable<unknown> {
    return this.api.put(`/services/${id}`, { status: status.toUpperCase() });
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete(`/services/${id}`);
  }

  private mapPublic(row: ApiServiceRow): ServiceListing {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      price: row.price != null ? Number(row.price) : undefined,
      priceUnit: (row.priceUnit as ServiceListing['priceUnit']) || 'FIXED',
      imageUrl: resolveAssetUrl(row.image) || undefined,
      status: row.status || 'DRAFT',
      shopId: row.shopId || row.shop?.id || '',
      shopName: row.shop?.name,
      city: row.city?.name,
      categoryName: row.category?.name,
    };
  }

  private mapManaged(row: ApiServiceRow): ManagedListingRow {
    return {
      id: row.id,
      title: row.title,
      status: String(row.status || '').toLowerCase(),
      price: row.price != null ? Number(row.price) : undefined,
      priceUnit: row.priceUnit,
      imageUrl: resolveAssetUrl(row.image) || undefined,
    };
  }
}
