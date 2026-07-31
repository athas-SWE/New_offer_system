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
    color: '#0d9488',
  },
  {
    id: 'c-fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Apparel, batik and local designers.',
    icon: 'checkroom',
    offerCount: 28,
    color: '#0f766e',
  },
  {
    id: 'c-travel',
    name: 'Travel',
    slug: 'travel',
    description: 'Hotels, tours and staycations island-wide.',
    icon: 'flight',
    offerCount: 19,
    color: '#115e59',
  },
  {
    id: 'c-wellness',
    name: 'Wellness',
    slug: 'wellness',
    description: 'Spas, Ayurveda and fitness deals.',
    icon: 'spa',
    offerCount: 15,
    color: '#14b8a6',
  },
  {
    id: 'c-electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, gadgets and home tech.',
    icon: 'devices',
    offerCount: 33,
    color: '#d97706',
  },
  {
    id: 'c-entertainment',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Movies, parks and family fun.',
    icon: 'celebration',
    offerCount: 11,
    color: '#f59e0b',
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
