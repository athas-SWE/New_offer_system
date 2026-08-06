import { Injectable, inject } from '@angular/core';
import { Observable, map, of, catchError, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { PosProduct, PosSale, PosTodaySummary, PosPaymentMethod } from '../models';
import { resolveAssetUrl } from '../utils/asset-url';

interface ApiPosProduct {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  stock?: number | string | null;
  image?: string | null;
  isActive: boolean;
  shopId: string;
}

interface Paginated<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreatePosProductPayload {
  name: string;
  sku?: string;
  price: number;
  stock?: number | null;
  isActive?: boolean;
}

export type UpdatePosProductPayload = Partial<CreatePosProductPayload>;

export interface CreatePosSalePayload {
  items: { productId: string; quantity: number }[];
  paymentMethod?: PosPaymentMethod;
  discount?: number;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly api = inject(ApiService);

  getTodaySummary(): Observable<PosTodaySummary | null> {
    return this.api.get<PosTodaySummary>('/pos/summary/today').pipe(catchError(() => of(null)));
  }

  getProducts(activeOnly = false): Observable<PosProduct[]> {
    return this.api
      .get<Paginated<ApiPosProduct>>('/pos/products', {
        page: 1,
        limit: 100,
        activeOnly: activeOnly ? true : undefined,
      })
      .pipe(
        map((res) => (res.data || []).map((p) => this.mapProduct(p))),
        catchError(() => of([])),
      );
  }

  createProduct(payload: CreatePosProductPayload): Observable<PosProduct> {
    return this.api.post<ApiPosProduct>('/pos/products', payload).pipe(map((p) => this.mapProduct(p)));
  }

  createWithImage(
    payload: CreatePosProductPayload,
    image?: File | null,
  ): Observable<PosProduct> {
    return this.createProduct(payload).pipe(
      switchMap((created) => {
        if (!image) return of(created);
        return this.uploadImage(created.id, image);
      }),
    );
  }

  updateProduct(id: string, payload: UpdatePosProductPayload): Observable<PosProduct> {
    return this.api
      .put<ApiPosProduct>(`/pos/products/${id}`, payload)
      .pipe(map((p) => this.mapProduct(p)));
  }

  uploadImage(id: string, file: File): Observable<PosProduct> {
    return this.api
      .upload<ApiPosProduct>(`/pos/products/${id}/image`, file)
      .pipe(map((p) => this.mapProduct(p)));
  }

  deleteProduct(id: string): Observable<unknown> {
    return this.api.delete(`/pos/products/${id}`);
  }

  getSales(): Observable<PosSale[]> {
    return this.api.get<Paginated<PosSale>>('/pos/sales', { page: 1, limit: 50 }).pipe(
      map((res) =>
        (res.data || []).map((s) => ({
          ...s,
          subtotal: Number(s.subtotal),
          discount: Number(s.discount),
          total: Number(s.total),
        })),
      ),
      catchError(() => of([])),
    );
  }

  createSale(payload: CreatePosSalePayload): Observable<PosSale> {
    return this.api.post<PosSale>('/pos/sales', payload);
  }

  private mapProduct(p: ApiPosProduct): PosProduct {
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      stock: p.stock == null ? null : Number(p.stock),
      imageUrl: resolveAssetUrl(p.image) || null,
      isActive: p.isActive,
      shopId: p.shopId,
    };
  }
}
