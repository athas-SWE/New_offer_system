import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardOfferRow, DashboardStats } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { formatLkr } from '../../shared/utils';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="section-title">Business dashboard</h1>
          <p class="section-sub">Track your offers, views and saves.</p>
        </div>
        <a routerLink="/offers" class="btn-primary">
          <mat-icon>add</mat-icon>
          Preview marketplace
        </a>
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (stats) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (card of cards; track card.label) {
            <div class="surface-panel">
              <p class="text-sm text-[var(--color-muted)]">{{ card.label }}</p>
              <p class="mt-2 font-display text-3xl font-semibold text-teal-900">{{ card.value }}</p>
            </div>
          }
        </div>

        <div class="mt-10 surface-panel overflow-x-auto">
          <h2 class="font-display text-xl font-semibold text-teal-900">Your offers</h2>
          <table class="mt-4 w-full min-w-[640px] text-left text-sm">
            <thead class="border-b border-teal-100 text-[var(--color-muted)]">
              <tr>
                <th class="pb-3 font-medium">Title</th>
                <th class="pb-3 font-medium">Status</th>
                <th class="pb-3 font-medium">Views</th>
                <th class="pb-3 font-medium">Saves</th>
                <th class="pb-3 font-medium">Ends</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows; track row.id) {
                <tr class="border-b border-teal-50">
                  <td class="py-3 font-medium text-teal-900">
                    <a [routerLink]="['/offers', row.id]" class="hover:underline">{{ row.title }}</a>
                  </td>
                  <td class="py-3">
                    <span class="chip" [class.!bg-gold-500]="row.status === 'active'" [class.!text-teal-900]="row.status === 'active'">
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="py-3">{{ row.views }}</td>
                  <td class="py-3">{{ row.saves }}</td>
                  <td class="py-3">{{ row.endsAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class BusinessDashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  stats?: DashboardStats;
  rows: DashboardOfferRow[] = [];
  loading = true;
  cards: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.dashboard.getBusinessStats().subscribe((stats) => {
      this.stats = stats;
      this.cards = [
        { label: 'Total offers', value: String(stats.totalOffers) },
        { label: 'Active', value: String(stats.activeOffers) },
        { label: 'Views', value: String(stats.totalViews) },
        { label: 'Est. revenue', value: formatLkr(stats.revenue || 0) },
      ];
      this.loading = false;
    });
    this.dashboard.getBusinessOffers().subscribe((rows) => (this.rows = rows));
  }
}
