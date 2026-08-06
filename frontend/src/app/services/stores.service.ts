import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResult, Store } from '../models';
import { normalizePageMeta } from '../models/pagination.model';
import { resolveAssetUrl } from '../utils/asset-url';
import { externalHref } from '../shared/utils';

const PLACEHOLDER_LOGO =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80';

interface ApiShop {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  locationUrl?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isActive?: boolean;
  status?: string;
  city?: { id?: string; name?: string } | null;
  owner?: { id?: string; name?: string; email?: string; phone?: string | null } | null;
}

interface PaginatedShops {
  data: ApiShop[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly api = inject(ApiService);

  getStores(search?: string, page = 1, limit = 12): Observable<Store[]> {
    return this.getStoresPage(search, page, limit).pipe(map((res) => res.items));
  }

  getStoresPage(
    search?: string,
    page = 1,
    limit = 12,
  ): Observable<PaginatedResult<Store>> {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 12;
    const params: Record<string, string | number | boolean | undefined> = {
      page: safePage,
      limit: safeLimit,
    };
    if (search?.trim()) params['search'] = search.trim();

    return this.api.get<PaginatedShops | ApiShop[]>('/shops', params).pipe(
      map((res) => {
        const rows = Array.isArray(res) ? res : res.data || [];
        const items = rows.map((row) => this.mapShop(row));
        return {
          items,
          meta: normalizePageMeta(
            Array.isArray(res) ? null : res.meta,
            safePage,
            safeLimit,
            items.length,
          ),
        };
      }),
      catchError(() =>
        of({ items: [], meta: normalizePageMeta(null, safePage, safeLimit, 0) }),
      ),
    );
  }

  getStoreById(id: string): Observable<Store | undefined> {
    return this.api.get<ApiShop>(`/shops/${id}`).pipe(
      map((row) => this.mapShop(row)),
      catchError(() => of(undefined))
    );
  }

  private mapShop(row: ApiShop): Store {
    const cityName =
      row.city?.name ||
      this.cityFromAddress(row.address) ||
      'Sri Lanka';

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      logoUrl: resolveAssetUrl(row.logoUrl) || PLACEHOLDER_LOGO,
      city: cityName,
      address: row.address || '',
      locationUrl: externalHref(row.locationUrl),
      phone: row.phone || undefined,
      website: externalHref(row.website),
      instagramUrl: externalHref(row.instagramUrl),
      facebookUrl: externalHref(row.facebookUrl),
      ownerName: row.owner?.name || undefined,
      rating: 0,
      offerCount: 0,
      isVerified: row.status === 'APPROVED',
      latitude: row.latitude != null ? Number(row.latitude) : undefined,
      longitude: row.longitude != null ? Number(row.longitude) : undefined,
    };
  }

  private cityFromAddress(address?: string | null): string | undefined {
    if (!address) return undefined;
    const known = [
      'Kalmunai',
      'Maruthamunai',
      'Sainthamaruthu',
      'Ampara',
      'Ninthavur',
      'Sammanthurai',
      'Pottuvil',
      'Akkaraipattu',
      'Karaithivu',
    ];
    return known.find((city) => address.toLowerCase().includes(city.toLowerCase()));
  }
}
