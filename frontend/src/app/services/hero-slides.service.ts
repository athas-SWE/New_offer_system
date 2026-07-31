import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { HeroSlide } from './admin.service';

@Injectable({ providedIn: 'root' })
export class HeroSlidesService {
  private readonly api = inject(ApiService);

  getActive(): Observable<HeroSlide[]> {
    return this.api.get<HeroSlide[]>('/hero-slides').pipe(catchError(() => of([])));
  }
}
