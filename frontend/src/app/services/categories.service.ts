import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models';

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'c-food',
    name: 'Food & Dining',
    slug: 'food-dining',
    description: 'Restaurants, cafés and street-food specials.',
    icon: 'restaurant',
    offerCount: 42,
    color: '#001C3D',
  },
  {
    id: 'c-fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Apparel, batik and local designers.',
    icon: 'checkroom',
    offerCount: 28,
    color: '#0d355c',
  },
  {
    id: 'c-travel',
    name: 'Travel',
    slug: 'travel',
    description: 'Hotels, tours and staycations island-wide.',
    icon: 'flight',
    offerCount: 19,
    color: '#1e4d7a',
  },
  {
    id: 'c-wellness',
    name: 'Wellness',
    slug: 'wellness',
    description: 'Spas, Ayurveda and fitness deals.',
    icon: 'spa',
    offerCount: 15,
    color: '#FFB800',
  },
  {
    id: 'c-electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, gadgets and home tech.',
    icon: 'devices',
    offerCount: 33,
    color: '#FF7A00',
  },
  {
    id: 'c-entertainment',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Movies, parks and family fun.',
    icon: 'celebration',
    offerCount: 11,
    color: '#FF4D00',
  },
];

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories').pipe(catchError(() => of(MOCK_CATEGORIES)));
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.api.get<Category>(`/categories/${slug}`).pipe(
      catchError(() => of(MOCK_CATEGORIES.find((c) => c.slug === slug || c.id === slug)))
    );
  }
}
