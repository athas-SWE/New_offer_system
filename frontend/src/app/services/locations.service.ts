import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface District {
  id: string;
  name: string;
  province?: string | null;
}

export interface City {
  id: string;
  name: string;
  slug?: string;
  districtId?: string;
  district?: District | null;
}

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private readonly api = inject(ApiService);

  getCities(districtId?: string): Observable<City[]> {
    return this.api
      .get<City[]>('/locations/cities', districtId ? { districtId } : undefined)
      .pipe(catchError(() => of([])));
  }

  getDistricts(): Observable<District[]> {
    return this.api.get<District[]>('/locations/districts').pipe(catchError(() => of([])));
  }
}
