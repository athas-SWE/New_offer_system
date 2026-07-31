import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Offer } from '../models';

const STORAGE_KEY = 'offer_lanka_favorites';

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
    return this.api.get<Offer[]>('/favorites').pipe(
      catchError(() => {
        const stored = localStorage.getItem(`${STORAGE_KEY}_offers`);
        if (stored) {
          try {
            return of(JSON.parse(stored) as Offer[]);
          } catch {
            return of([]);
          }
        }
        return of([]);
      })
    );
  }

  toggle(offer: Offer): Observable<boolean> {
    if (!this.auth.isAuthenticated) {
      return of(false);
    }
    const exists = this.isFavorite(offer.id);
    if (exists) {
      return this.remove(offer.id);
    }
    return this.add(offer);
  }

  add(offer: Offer): Observable<boolean> {
    return this.api.post<void>(`/favorites/${offer.id}`, {}).pipe(
      tap(() => this.setIds([...this.favoriteIds, offer.id], offer, 'add')),
      map(() => true),
      catchError(() => {
        this.setIds([...this.favoriteIds, offer.id], offer, 'add');
        return of(true);
      })
    );
  }

  remove(offerId: string): Observable<boolean> {
    return this.api.delete<void>(`/favorites/${offerId}`).pipe(
      tap(() => this.setIds(this.favoriteIds.filter((id) => id !== offerId), undefined, 'remove', offerId)),
      map(() => false),
      catchError(() => {
        this.setIds(this.favoriteIds.filter((id) => id !== offerId), undefined, 'remove', offerId);
        return of(false);
      })
    );
  }

  private setIds(ids: string[], offer?: Offer, action?: 'add' | 'remove', removeId?: string): void {
    const unique = [...new Set(ids)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    this.idsSubject.next(unique);

    const raw = localStorage.getItem(`${STORAGE_KEY}_offers`);
    let offers: Offer[] = [];
    if (raw) {
      try {
        offers = JSON.parse(raw) as Offer[];
      } catch {
        offers = [];
      }
    }
    if (action === 'add' && offer) {
      offers = [...offers.filter((o) => o.id !== offer.id), offer];
    }
    if (action === 'remove' && removeId) {
      offers = offers.filter((o) => o.id !== removeId);
    }
    localStorage.setItem(`${STORAGE_KEY}_offers`, JSON.stringify(offers));
  }

  private readIds(): string[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
}
