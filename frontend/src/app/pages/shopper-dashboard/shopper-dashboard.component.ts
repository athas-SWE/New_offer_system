import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { CustomerDashboard } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-shopper-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Shopper dashboard</h1>
          <p class="section-sub">Your saved deals, alerts and offers ending soon.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a routerLink="/offers" class="btn-primary">
            <mat-icon>local_offer</mat-icon>
            Browse offers
          </a>
          <a routerLink="/favorites" class="btn-secondary">
            <mat-icon>favorite</mat-icon>
            Favourites
          </a>
        </div>
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (error) {
        <div class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
      } @else if (data) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (card of cards; track card.label) {
            <div class="surface-panel">
              <p class="text-sm text-[var(--color-muted)]">{{ card.label }}</p>
              <p class="mt-2 font-display text-3xl font-semibold text-teal-900">{{ card.value }}</p>
            </div>
          }
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <section class="surface-panel">
            <h2 class="font-display text-xl font-semibold text-teal-900">Ending soon</h2>
            @if (!data.endingSoon.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No active offers ending soon.</p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (row of data.endingSoon; track row.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-teal-50 pb-3 text-sm">
                    <div>
                      <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">
                        {{ row.title }}
                      </a>
                      <p class="text-[var(--color-muted)]">
                        {{ row.views }} views · ends {{ row.endsAt | date: 'mediumDate' }}
                      </p>
                    </div>
                    <span class="chip">{{ row.status }}</span>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="surface-panel">
            <h2 class="font-display text-xl font-semibold text-teal-900">Recent favourites</h2>
            @if (!data.recentFavorites.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">
                You have not saved any offers yet.
                <a routerLink="/offers" class="font-semibold text-teal-700 hover:underline">Browse offers</a>
              </p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (row of data.recentFavorites; track row.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-teal-50 pb-3 text-sm">
                    <div>
                      <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">
                        {{ row.title }}
                      </a>
                      <p class="text-[var(--color-muted)]">
                        @if (row.businessName) {
                          {{ row.businessName }} ·
                        }
                        ends {{ row.endsAt | date: 'mediumDate' }}
                      </p>
                    </div>
                    <span class="chip">{{ row.status }}</span>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class ShopperDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  data?: CustomerDashboard;
  loading = true;
  error = '';
  cards: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.dashboard.getCustomerDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.cards = [
          { label: 'Favourites', value: String(data.favorites) },
          { label: 'Active offers', value: String(data.activeOffers) },
          { label: 'Unread alerts', value: String(data.unreadNotifications ?? 0) },
          { label: 'Your reviews', value: String(data.reviews ?? 0) },
        ];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load shopper dashboard. Please log in as CUSTOMER.';
        this.loading = false;
      },
    });
  }
}
