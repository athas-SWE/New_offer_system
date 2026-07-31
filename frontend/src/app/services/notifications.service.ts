import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AppNotification } from '../models';

const MOCK: AppNotification[] = [
  {
    id: 'n1',
    title: 'New seafood deal near you',
    message: 'Harbour Kitchen just dropped 35% off Sunday Feast.',
    type: 'offer',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/offers/o1',
  },
  {
    id: 'n2',
    title: 'Weekend spa flash',
    message: 'Lotus Wellness: 40% off aromatherapy this weekend.',
    type: 'promo',
    read: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    link: '/offers/o2',
  },
  {
    id: 'n3',
    title: 'Welcome to Offer Lanka',
    message: 'Save your favourite deals and get alerts for nearby offers.',
    type: 'system',
    read: true,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);
  private readonly listSubject = new BehaviorSubject<AppNotification[]>(MOCK);

  readonly notifications$ = this.listSubject.asObservable();

  getNotifications(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications').pipe(
      tap((list) => this.listSubject.next(list)),
      catchError(() => {
        this.listSubject.next(MOCK);
        return of(MOCK);
      })
    );
  }

  markRead(id: string): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`, {}).pipe(
      tap(() => {
        this.listSubject.next(
          this.listSubject.value.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }),
      catchError(() => {
        this.listSubject.next(
          this.listSubject.value.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        return of(void 0);
      })
    );
  }

  markAllRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {}).pipe(
      tap(() => {
        this.listSubject.next(this.listSubject.value.map((n) => ({ ...n, read: true })));
      }),
      catchError(() => {
        this.listSubject.next(this.listSubject.value.map((n) => ({ ...n, read: true })));
        return of(void 0);
      })
    );
  }

  unreadCount(): number {
    return this.listSubject.value.filter((n) => !n.read).length;
  }
}
