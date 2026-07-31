import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { Store } from '../models';
import { resolveAssetUrl } from '../utils/asset-url';

const PLACEHOLDER_LOGO =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80';

interface ApiShop {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isActive?: boolean;
  status?: string;
  city?: { id?: string; name?: string } | null;
}

interface PaginatedShops {
  data: ApiShop[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly api = inject(ApiService);

  getStores(search?: string): Observable<Store[]> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: 1,
      limit: 50,
    };
    if (search?.trim()) params['search'] = search.trim();

    return this.api.get<PaginatedShops | ApiShop[]>('/shops', params).pipe(
      map((res) => {
        const rows = Array.isArray(res) ? res : res.data || [];
        return rows.map((row) => this.mapShop(row));
      }),
      catchError(() => of([]))
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
      phone: row.phone || undefined,
      rating: 0,
      offerCount: 0,
      isVerified: row.status === 'APPROVED',
      latitude: row.latitude != null ? Number(row.latitude) : undefined,
      longitude: row.longitude != null ? Number(row.longitude) : undefined,
    };
  }

  private cityFromAddress(address?: string | null): string | undefined {
    if (!address) return undefined;
    const known = ['Colombo', 'Kandy', 'Negombo', 'Nuwara Eliya', 'Galle', 'Jaffna'];
    return known.find((city) => address.toLowerCase().includes(city.toLowerCase()));
  }
}
