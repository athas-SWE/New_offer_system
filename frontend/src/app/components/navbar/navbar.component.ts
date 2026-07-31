import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe, MatIconModule, MatButtonModule],
  template: `
    <header class="sticky top-0 z-50 border-b border-teal-100/80 bg-white/85 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a routerLink="/" class="flex items-center gap-2">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-gold-400">OL</span>
          <span class="font-display text-xl font-semibold text-teal-900">Offer Lanka</span>
        </a>

        <nav class="hidden items-center gap-1 md:flex">
          @for (link of links; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-teal-50 text-teal-800"
              class="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-teal-50 hover:text-teal-800"
              >{{ link.label }}</a
            >
          }
        </nav>

        <div class="flex items-center gap-2">
          <a routerLink="/search" class="rounded-lg p-2 text-teal-800 hover:bg-teal-50" aria-label="Search">
            <mat-icon>search</mat-icon>
          </a>
          <a routerLink="/notifications" class="relative rounded-lg p-2 text-teal-800 hover:bg-teal-50" aria-label="Notifications">
            <mat-icon>notifications</mat-icon>
            @if (unread > 0) {
              <span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold-500"></span>
            }
          </a>
          <ng-container *ngIf="auth.currentUser$ | async as user; else guest">
            <a routerLink="/favorites" class="hidden rounded-lg p-2 text-teal-800 hover:bg-teal-50 sm:inline-flex" aria-label="Favorites">
              <mat-icon>favorite_border</mat-icon>
            </a>
            <a routerLink="/profile" class="hidden rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 sm:inline-flex">
              {{ user.name }}
            </a>
            @if (user.role === 'ADMIN') {
              <a routerLink="/admin" class="btn-primary !px-3 !py-2 text-xs">Admin</a>
            }
            @if (user.role === 'BUSINESS_OWNER') {
              <a routerLink="/business" class="btn-primary !px-3 !py-2 text-xs">Dashboard</a>
            }
          </ng-container>
          <ng-template #guest>
            <a routerLink="/login" class="btn-secondary !px-3 !py-2 text-xs">Log in</a>
            <a routerLink="/register" class="btn-primary !px-3 !py-2 text-xs">Join</a>
          </ng-template>

          <button type="button" class="rounded-lg p-2 text-teal-800 hover:bg-teal-50 md:hidden" (click)="menuOpen = !menuOpen" aria-label="Menu">
            <mat-icon>{{ menuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (menuOpen) {
        <div class="border-t border-teal-100 bg-white px-4 py-3 md:hidden">
          <div class="flex flex-col gap-1">
            @for (link of links; track link.path) {
              <a [routerLink]="link.path" class="rounded-lg px-3 py-2 text-sm font-medium text-teal-900 hover:bg-teal-50" (click)="menuOpen = false">
                {{ link.label }}
              </a>
            }
          </div>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);

  menuOpen = false;
  links = [
    { path: '/offers', label: 'Offers' },
    { path: '/categories', label: 'Categories' },
    { path: '/stores', label: 'Stores' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  get unread(): number {
    return this.notifications.unreadCount();
  }
}
