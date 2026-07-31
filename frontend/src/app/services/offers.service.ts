import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Offer, OfferFilter } from '../models';

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
    city: 'Colombo',
    latitude: 6.9271,
    longitude: 79.8612,
    startsAt: '2026-07-01',
    endsAt: '2026-08-31',
    isFeatured: true,
    tags: ['seafood', 'weekend'],
    distanceKm: 1.2,
  },
  {
    id: 'o2',
    title: 'Monsoon Spa Escape',
    description: '90-minute aromatherapy massage with herbal tea.',
    discountPercent: 40,
    originalPrice: 9000,
    offerPrice: 5400,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    categoryId: 'c-wellness',
    categoryName: 'Wellness',
    storeId: 's2',
    storeName: 'Lotus Wellness',
    city: 'Kandy',
    latitude: 7.2906,
    longitude: 80.6337,
    startsAt: '2026-07-10',
    endsAt: '2026-09-15',
    isFeatured: true,
    tags: ['spa', 'relax'],
    distanceKm: 4.8,
  },
  {
    id: 'o3',
    title: 'Island Fashion Drop',
    description: 'Buy 2 get 1 free on batik shirts & linen sets.',
    discountPercent: 30,
    originalPrice: 4800,
    offerPrice: 3360,
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    categoryId: 'c-fashion',
    categoryName: 'Fashion',
    storeId: 's3',
    storeName: 'Ceylon Threads',
    city: 'Negombo',
    latitude: 7.2083,
    longitude: 79.8358,
    startsAt: '2026-07-05',
    endsAt: '2026-08-20',
    tags: ['batik', 'sale'],
    distanceKm: 2.1,
  },
  {
    id: 'o4',
    title: 'Hill Country Staycation',
    description: 'One night in a boutique tea bungalow with breakfast.',
    discountPercent: 25,
    originalPrice: 22000,
    offerPrice: 16500,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    categoryId: 'c-travel',
    categoryName: 'Travel',
    storeId: 's4',
    storeName: 'Misty Peak Lodge',
    city: 'Nuwara Eliya',
    latitude: 6.9497,
    longitude: 80.7891,
    startsAt: '2026-07-01',
    endsAt: '2026-10-01',
    isFeatured: true,
    tags: ['hotel', 'tea country'],
    distanceKm: 12.4,
  },
  {
    id: 'o5',
    title: 'Tech Bundle Week',
    description: 'Wireless earbuds + power bank combo at Liberty Plaza.',
    discountPercent: 20,
    originalPrice: 12500,
    offerPrice: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    categoryId: 'c-electronics',
    categoryName: 'Electronics',
    storeId: 's5',
    storeName: 'Pixel Hub',
    city: 'Colombo',
    latitude: 6.9147,
    longitude: 79.8507,
    startsAt: '2026-07-20',
    endsAt: '2026-08-10',
    tags: ['gadgets'],
    distanceKm: 0.9,
  },
  {
    id: 'o6',
    title: 'Family Fun Day Pass',
    description: 'Unlimited rides for 2 adults + 2 kids at Softlogic.',
    discountPercent: 45,
    originalPrice: 8000,
    offerPrice: 4400,
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    categoryId: 'c-entertainment',
    categoryName: 'Entertainment',
    storeId: 's6',
    storeName: 'PlaySphere SL',
    city: 'Colombo',
    latitude: 6.9278,
    longitude: 79.8615,
    startsAt: '2026-07-15',
    endsAt: '2026-09-01',
    tags: ['family', 'kids'],
    distanceKm: 1.5,
  },
];

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly api = inject(ApiService);

  getOffers(filter: OfferFilter = {}): Observable<Offer[]> {
    return this.api.get<Offer[]>('/offers', filter as Record<string, string | number | boolean | undefined>).pipe(
      catchError(() => of(this.filterMock(filter)))
    );
  }

  getOfferById(id: string): Observable<Offer | undefined> {
    return this.api.get<Offer>(`/offers/${id}`).pipe(
      catchError(() => of(MOCK_OFFERS.find((o) => o.id === id)))
    );
  }

  getFeatured(): Observable<Offer[]> {
    return this.api.get<Offer[]>('/offers/featured').pipe(
      catchError(() => of(MOCK_OFFERS.filter((o) => o.isFeatured)))
    );
  }

  getNearby(lat: number, lng: number, radiusKm = 10): Observable<Offer[]> {
    return this.api.get<Offer[]>('/offers/nearby', { lat, lng, radiusKm }).pipe(
      catchError(() =>
        of(
          MOCK_OFFERS.map((o) => ({
            ...o,
            distanceKm: o.distanceKm ?? Math.random() * radiusKm,
          })).sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
        )
      )
    );
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
