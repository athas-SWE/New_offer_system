import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Store } from '../models';

const MOCK_STORES: Store[] = [
  {
    id: 's1',
    name: 'Harbour Kitchen',
    description: 'Waterfront dining with Sri Lankan seafood classics.',
    logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    city: 'Colombo',
    address: 'Galle Face, Colombo 03',
    phone: '+94 11 234 5678',
    website: 'https://example.com',
    rating: 4.7,
    offerCount: 8,
    isVerified: true,
    latitude: 6.9271,
    longitude: 79.8612,
  },
  {
    id: 's2',
    name: 'Lotus Wellness',
    description: 'Ayurvedic spa & wellness retreats in the hills.',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80',
    city: 'Kandy',
    address: 'Peradeniya Road, Kandy',
    rating: 4.9,
    offerCount: 5,
    isVerified: true,
  },
  {
    id: 's3',
    name: 'Ceylon Threads',
    description: 'Handloom and batik fashion for everyday elegance.',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80',
    city: 'Negombo',
    address: 'Main Street, Negombo',
    rating: 4.5,
    offerCount: 12,
  },
  {
    id: 's4',
    name: 'Misty Peak Lodge',
    description: 'Boutique bungalows overlooking tea estates.',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80',
    city: 'Nuwara Eliya',
    address: 'Pedro Estate Road',
    rating: 4.8,
    offerCount: 3,
    isVerified: true,
  },
  {
    id: 's5',
    name: 'Pixel Hub',
    description: 'Gadgets, accessories and repair services.',
    logoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    city: 'Colombo',
    address: 'Liberty Plaza, Colombo 03',
    rating: 4.3,
    offerCount: 15,
  },
  {
    id: 's6',
    name: 'PlaySphere SL',
    description: 'Family entertainment and indoor attractions.',
    logoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=200&q=80',
    city: 'Colombo',
    address: 'Marine Drive',
    rating: 4.6,
    offerCount: 4,
  },
];

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly api = inject(ApiService);

  getStores(search?: string): Observable<Store[]> {
    return this.api.get<Store[]>('/stores', { search }).pipe(
      catchError(() => {
        const q = search?.toLowerCase().trim();
        if (!q) {
          return of(MOCK_STORES);
        }
        return of(
          MOCK_STORES.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.city.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q)
          )
        );
      })
    );
  }

  getStoreById(id: string): Observable<Store | undefined> {
    return this.api.get<Store>(`/stores/${id}`).pipe(
      catchError(() => of(MOCK_STORES.find((s) => s.id === id)))
    );
  }
}
