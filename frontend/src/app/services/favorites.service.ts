import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Offer } from '../models';
import { resolveAssetUrl } from '../utils/asset-url';

const STORAGE_KEY = 'offer_lanka_favorites';
const OFFERS_KEY = `${STORAGE_KEY}_offers`;

interface ApiFavorite {
  offerId?: string;
  offer?: {
    id: string;
    title: string;
    description?: string | null;
    discountPercent?: number | string;
    image?: string | null;
    images?: Array<{ imageUrl?: string; isPrimary?: boolean }>;
    category?: { id?: string; name?: string } | null;
    shop?: {
      id?: string;
      name?: string;
      address?: string | null;
      phone?: string | null;
      locationUrl?: string | null;
    } | null;
    shopId?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly idsSubject = new BehaviorSubject<string[]>(this.readIds());

  readonly favoriteIds$ = this.idsSubject.asObservable();

  get favoriteIds(): string[] {
    return this.idsSubject.value;
  }

  isFavorite(offerId: string): boolean {
    return this.favoriteIds.includes(offerId);
  }

  getFavorites(): Observable<Offer[]> {
    if (!this.auth.isAuthenticated) {
      return of(this.readLocalOffers());
    }

    return this.api.get<ApiFavorite[] | Offer[]>('/favorites').pipe(
      map((rows) => this.mapFavoritesResponse(rows)),
      tap((offers) => {
        this.setIds(offers.map((o) => o.id));
        localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
      }),
      catchError(() => of(this.readLocalOffers())),
    );
  }

  toggle(offer: Offer): Observable<boolean> {
    const exists = this.isFavorite(offer.id);
    if (exists) {
      return this.remove(offer.id);
    }
    return this.add(offer);
  }

  add(offer: Offer): Observable<boolean> {
    if (!this.auth.isAuthenticated) {
      this.setIds([...this.favoriteIds, offer.id], offer, 'add');
      return of(true);
    }

    return this.api.post<void>('/favorites', { offerId: offer.id }).pipe(
      tap(() => this.setIds([...this.favoriteIds, offer.id], offer, 'add')),
      map(() => true),
      catchError(() => {
        this.setIds([...this.favoriteIds, offer.id], offer, 'add');
        return of(true);
      }),
    );
  }

  remove(offerId: string): Observable<boolean> {
    if (!this.auth.isAuthenticated) {
      this.setIds(
        this.favoriteIds.filter((id) => id !== offerId),
        undefined,
        'remove',
        offerId,
      );
      return of(false);
    }

    return this.api.delete<void>(`/favorites/${offerId}`).pipe(
      tap(() =>
        this.setIds(
          this.favoriteIds.filter((id) => id !== offerId),
          undefined,
          'remove',
          offerId,
        ),
      ),
      map(() => false),
      catchError(() => {
        this.setIds(
          this.favoriteIds.filter((id) => id !== offerId),
          undefined,
          'remove',
          offerId,
        );
        return of(false);
      }),
    );
  }

  private mapFavoritesResponse(rows: ApiFavorite[] | Offer[]): Offer[] {
    if (!Array.isArray(rows) || !rows.length) {
      return this.readLocalOffers();
    }

    if ('title' in rows[0] && 'discountPercent' in rows[0]) {
      return rows as Offer[];
    }

    return (rows as ApiFavorite[])
      .map((row) => this.mapFavoriteOffer(row))
      .filter((offer): offer is Offer => !!offer);
  }

  private mapFavoriteOffer(row: ApiFavorite): Offer | null {
    const offer = row.offer;
    if (!offer?.id) return null;
    const discount = Number(offer.discountPercent) || 0;
    const imageUrl =
      resolveAssetUrl(
        offer.image ||
          offer.images?.find((img) => img.isPrimary)?.imageUrl ||
          offer.images?.[0]?.imageUrl,
      ) || '';

    return {
      id: offer.id,
      title: offer.title,
      description: offer.description || '',
      discountPercent: discount,
      originalPrice: 0,
      offerPrice: 0,
      imageUrl,
      categoryId: offer.category?.id || '',
      categoryName: offer.category?.name || 'Offer',
      storeId: offer.shopId || offer.shop?.id || '',
      storeName: offer.shop?.name || 'Shop',
      city: offer.shop?.address || undefined,
      storePhone: offer.shop?.phone || undefined,
      locationUrl: offer.shop?.locationUrl || undefined,
      latitude: offer.latitude != null ? Number(offer.latitude) : undefined,
      longitude: offer.longitude != null ? Number(offer.longitude) : undefined,
      startsAt: offer.startDate || new Date().toISOString(),
      endsAt: offer.endDate || new Date().toISOString(),
      isFeatured: offer.status === 'ACTIVE',
    };
  }

  private setIds(
    ids: string[],
    offer?: Offer,
    action?: 'add' | 'remove',
    removeId?: string,
  ): void {
    const unique = [...new Set(ids)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    this.idsSubject.next(unique);

    let offers = this.readLocalOffers();
    if (action === 'add' && offer) {
      offers = [...offers.filter((o) => o.id !== offer.id), offer];
    }
    if (action === 'remove' && removeId) {
      offers = offers.filter((o) => o.id !== removeId);
    }
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
  }

  private readIds(): string[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  private readLocalOffers(): Offer[] {
    const raw = localStorage.getItem(OFFERS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Offer[];
    } catch {
      return [];
    }
  }
}
