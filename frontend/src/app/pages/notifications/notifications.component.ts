import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService } from '../../services/notifications.service';
import { AppNotification } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Notifications</h1>
          <p class="section-sub">Deal alerts and account updates.</p>
        </div>
        <button type="button" class="btn-secondary" (click)="markAll()">Mark all read</button>
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (!items.length) {
        <div class="surface-panel mt-8 text-center">
          <p class="font-display text-xl text-teal-900">You're all caught up</p>
        </div>
      } @else {
        <div class="mt-8 space-y-3">
          @for (item of items; track item.id) {
            <article
              class="surface-panel flex gap-4 transition"
              [class.border-l-4]="!item.read"
              [class.border-l-gold-500]="!item.read"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <mat-icon>{{ iconFor(item.type) }}</mat-icon>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <h2 class="font-semibold text-teal-900">{{ item.title }}</h2>
                  <time class="text-xs text-[var(--color-muted)]">{{ item.createdAt | date: 'medium' }}</time>
                </div>
                <p class="mt-1 text-sm text-[var(--color-muted)]">{{ item.message }}</p>
                <div class="mt-3 flex gap-3">
                  @if (item.link) {
                    <a [routerLink]="item.link" class="text-sm font-semibold text-teal-700 hover:underline">Open</a>
                  }
                  @if (!item.read) {
                    <button type="button" class="text-sm font-semibold text-gold-600" (click)="markOne(item.id)">Mark read</button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly notifications = inject(NotificationsService);
  items: AppNotification[] = [];
  loading = true;

  ngOnInit(): void {
    this.notifications.getNotifications().subscribe((list) => {
      this.items = list;
      this.loading = false;
    });
  }

  iconFor(type: AppNotification['type']): string {
    if (type === 'offer') return 'local_offer';
    if (type === 'promo') return 'campaign';
    return 'info';
  }

  markOne(id: string): void {
    this.notifications.markRead(id).subscribe(() => {
      this.items = this.items.map((n) => (n.id === id ? { ...n, read: true } : n));
    });
  }

  markAll(): void {
    this.notifications.markAllRead().subscribe(() => {
      this.items = this.items.map((n) => ({ ...n, read: true }));
    });
  }
}
