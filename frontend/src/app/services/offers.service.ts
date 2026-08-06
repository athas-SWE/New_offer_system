import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { Offer, OfferFilter, PaginatedResult } from '../models';
import { normalizePageMeta } from '../models/pagination.model';
import { resolveAssetUrl } from '../utils/asset-url';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80';

interface ApiOffer {
  id: string;
  title: string;
  description?: string | null;
  discountPercent?: number | string;
  originalPrice?: number | string | null;
  offerPrice?: number | string | null;
  image?: string | null;
  images?: Array<{ imageUrl?: string; isPrimary?: boolean }>;
  categoryId?: string | null;
  category?: { id?: string; name?: string } | null;
  shopId?: string;
  businessId?: string;
  shop?: {
    id?: string;
    name?: string;
    address?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    locationUrl?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  business?: { id?: string; name?: string; address?: string | null; phone?: string | null } | null;
  cityId?: string | null;
  city?: { id?: string; name?: string } | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface PaginatedOffers {
  data: ApiOffer[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

const MOCK_OFFERS: Offer[] = [
  {
    id: 'o1',
    title: 'Sunday Seafood Feast',
    description: 'Fresh catch platter with rice & salad for two at Galle Face.',
    discountPercent: 35,
    originalPrice: 6500,
    offerPrice: 4225,
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    categoryId: 'c-food',
    categoryName: 'Food & Dining',
    storeId: 's1',
    storeName: 'Harbour Kitchen',
    city: 'Kalmunai',
    latitude: 7.4167,
    longitude: 81.8167,
    startsAt: '2026-07-01',
    endsAt: '2026-08-31',
    isFeatured: true,
    tags: ['seafood', 'weekend'],
    distanceKm: 1.2,
  },
];

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly api = inject(ApiService);

  getOffers(filter: OfferFilter = {}): Observable<Offer[]> {
    return this.getOffersPage(filter).pipe(map((res) => res.items));
  }

  getOffersPage(filter: OfferFilter = {}): Observable<PaginatedResult<Offer>> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 12;
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit,
    };
    if (filter.search?.trim()) params['search'] = filter.search.trim();
    if (filter.categoryId) params['categoryId'] = filter.categoryId;
    if (filter.storeId) params['shopId'] = filter.storeId;
    if (filter.cityId) params['cityId'] = filter.cityId;

    return this.api.get<PaginatedOffers | ApiOffer[]>('/offers', params).pipe(
      map((res) => {
        const rows = Array.isArray(res) ? res : res.data || [];
        let offers = rows.map((row) => this.mapOffer(row));
        if (filter.city && !filter.cityId) {
          const city = filter.city.toLowerCase();
          offers = offers.filter((o) => o.city?.toLowerCase() === city);
        }
        if (filter.minDiscount) {
          offers = offers.filter((o) => o.discountPercent >= filter.minDiscount!);
        }
        const meta = normalizePageMeta(
          Array.isArray(res) ? null : res.meta,
          page,
          limit,
          offers.length,
        );
        return { items: offers, meta };
      }),
      catchError(() => {
        const items = this.filterMock(filter);
        const start = (page - 1) * limit;
        const slice = items.slice(start, start + limit);
        return of({
          items: slice,
          meta: normalizePageMeta(
            {
              total: items.length,
              page,
              limit,
              totalPages: Math.ceil(items.length / limit) || 0,
            },
            page,
            limit,
            items.length,
          ),
        });
      }),
    );
  }

  getOfferById(id: string): Observable<Offer | undefined> {
    return this.api.get<ApiOffer>(`/offers/${id}`).pipe(
      map((row) => this.mapOffer(row)),
      catchError(() => of(MOCK_OFFERS.find((o) => o.id === id)))
    );
  }

  getFeatured(page = 1, limit = 6): Observable<PaginatedResult<Offer>> {
    return this.getOffersPage({ page, limit }).pipe(
      catchError(() => {
        const items = MOCK_OFFERS.filter((o) => o.isFeatured);
        return of({
          items: items.slice(0, limit),
          meta: normalizePageMeta(
            { total: items.length, page: 1, limit, totalPages: 1 },
            1,
            limit,
            items.length,
          ),
        });
      }),
    );
  }

  getNearby(lat: number, lng: number, radiusKm = 10): Observable<Offer[]> {
    return this.getOffers().pipe(
      map((offers) =>
        offers
          .map((o) => ({
            ...o,
            distanceKm:
              o.latitude != null && o.longitude != null
                ? this.haversineKm(lat, lng, o.latitude, o.longitude)
                : undefined,
          }))
          .filter((o) => o.distanceKm == null || o.distanceKm <= radiusKm)
          .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
      ),
      catchError(() => of(MOCK_OFFERS))
    );
  }

  private mapOffer(row: ApiOffer): Offer {
    const discount = Number(row.discountPercent) || 0;
    const primaryImage =
      resolveAssetUrl(
        row.image ||
          row.images?.find((img) => img.isPrimary)?.imageUrl ||
          row.images?.[0]?.imageUrl,
      ) || PLACEHOLDER_IMAGE;

    const shop = row.shop || row.business;
    const cityName =
      row.city?.name ||
      this.cityFromAddress(shop?.address) ||
      'Sri Lanka';

    const lat =
      row.latitude != null
        ? Number(row.latitude)
        : row.shop?.latitude != null
          ? Number(row.shop.latitude)
          : undefined;
    const lng =
      row.longitude != null
        ? Number(row.longitude)
        : row.shop?.longitude != null
          ? Number(row.shop.longitude)
          : undefined;

    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      discountPercent: discount,
      originalPrice: Number(row.originalPrice) || 0,
      offerPrice: Number(row.offerPrice) || 0,
      imageUrl: primaryImage,
      categoryId: row.categoryId || row.category?.id || '',
      categoryName: row.category?.name || 'Offer',
      storeId: row.shopId || row.businessId || shop?.id || '',
      storeName: shop?.name || 'Shop',
      storePhone: row.shop?.phone || row.business?.phone || undefined,
      locationUrl: row.shop?.locationUrl || undefined,
      city: cityName,
      latitude: lat,
      longitude: lng,
      startsAt: row.startDate || new Date().toISOString(),
      endsAt: row.endDate || new Date().toISOString(),
      isFeatured: row.status === 'ACTIVE',
      tags: row.status ? [row.status.toLowerCase()] : [],
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

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private filterMock(filter: OfferFilter): Offer[] {
    return MOCK_OFFERS.filter((offer) => {
      const q = filter.search?.toLowerCase().trim();
      const matchesSearch =
        !q ||
        offer.title.toLowerCase().includes(q) ||
        offer.description.toLowerCase().includes(q) ||
        offer.storeName?.toLowerCase().includes(q) ||
        offer.city?.toLowerCase().includes(q);
      const matchesCategory = !filter.categoryId || offer.categoryId === filter.categoryId;
      const matchesStore = !filter.storeId || offer.storeId === filter.storeId;
      const matchesCity = !filter.city || offer.city?.toLowerCase() === filter.city.toLowerCase();
      const matchesDiscount = !filter.minDiscount || offer.discountPercent >= filter.minDiscount;
      return matchesSearch && matchesCategory && matchesStore && matchesCity && matchesDiscount;
    });
  }
}
