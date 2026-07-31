import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardOfferRow, DashboardStats } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Admin dashboard</h1>
          <p class="section-sub">Live platform overview for Offer Lanka.</p>
        </div>
        <a routerLink="/stores" class="btn-secondary">
          <mat-icon>store</mat-icon>
          View stores
        </a>
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (error) {
        <div class="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
      } @else if (stats) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (card of cards; track card.label) {
            <div class="surface-panel border-t-4 border-t-teal-600">
              <p class="text-sm text-[var(--color-muted)]">{{ card.label }}</p>
              <p class="mt-2 font-display text-3xl font-semibold text-teal-900">{{ card.value }}</p>
            </div>
          }
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <div class="surface-panel">
            <h2 class="font-display text-xl font-semibold text-teal-900">Recent offers</h2>
            @if (!rows.length) {
              <p class="mt-4 text-sm text-[var(--color-muted)]">No offers yet.</p>
            } @else {
              <ul class="mt-4 space-y-3">
                @for (row of rows; track row.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-teal-50 pb-3 text-sm">
                    <div>
                      <a [routerLink]="['/offers', row.id]" class="font-semibold text-teal-900 hover:underline">{{ row.title }}</a>
                      <p class="text-[var(--color-muted)]">
                        {{ row.views }} views
                        @if (row.businessName) {
                          · {{ row.businessName }}
                        }
                        · ends {{ row.endsAt | date: 'mediumDate' }}
                      </p>
                    </div>
                    <span class="chip">{{ row.status }}</span>
                  </li>
                }
              </ul>
            }
          </div>
          <div class="surface-panel bg-gradient-to-br from-teal-700 to-teal-900 text-white">
            <h2 class="font-display text-xl font-semibold">Moderation queue</h2>
            <p class="mt-2 text-sm text-teal-100">Real pending counts from the database.</p>
            <ul class="mt-6 space-y-3 text-sm">
              <li class="rounded-xl bg-white/10 px-4 py-3">
                {{ stats.pendingBusinesses || 0 }} business applications pending
              </li>
              <li class="rounded-xl bg-white/10 px-4 py-3">
                {{ stats.pendingOffers || 0 }} offers awaiting approval
              </li>
              <li class="rounded-xl bg-white/10 px-4 py-3">
                {{ stats.expiredOffers || 0 }} expired offers
              </li>
            </ul>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  stats?: DashboardStats;
  rows: DashboardOfferRow[] = [];
  loading = true;
  error = '';
  cards: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.dashboard.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.cards = [
          { label: 'Users', value: String(stats.users ?? 0) },
          { label: 'Businesses', value: String(stats.businesses ?? 0) },
          { label: 'Stores', value: String(stats.stores ?? 0) },
          { label: 'Active offers', value: String(stats.activeOffers) },
          { label: 'Total offers', value: String(stats.totalOffers) },
          { label: 'Views', value: String(stats.totalViews) },
          { label: 'Favourites', value: String(stats.favorites) },
          { label: 'Pending businesses', value: String(stats.pendingBusinesses ?? 0) },
          { label: 'Pending offers', value: String(stats.pendingOffers ?? 0) },
        ];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load admin dashboard. Please log in as ADMIN.';
        this.loading = false;
      },
    });
    this.dashboard.getAdminRecentOffers().subscribe((rows) => (this.rows = rows));
  }
}
