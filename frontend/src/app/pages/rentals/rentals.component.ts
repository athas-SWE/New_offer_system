import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RentalsService } from '../../services/rentals.service';
import { RentalListing } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { formatLkr } from '../../shared/utils';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Rentals</h1>
      <p class="section-sub">Find items and spaces for hire from local shops.</p>

      <div class="mt-8">
        <input
          class="input-field max-w-xl"
          [(ngModel)]="search"
          (ngModelChange)="apply()"
          placeholder="Search rentals…"
        />
      </div>

      @if (loading) {
        <app-loading-spinner label="Loading rentals…" />
      } @else if (!items.length) {
        <div class="surface-panel mt-10 text-center">
          <p class="font-display text-xl text-teal-900">No rentals found</p>
          <p class="mt-2 text-sm text-[var(--color-muted)]">Check back soon or browse shops.</p>
          <a routerLink="/shops" class="btn-primary mt-4">Browse shops</a>
        </div>
      } @else {
        <p class="mt-6 text-sm text-[var(--color-muted)]">{{ items.length }} rentals found</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of items; track item.id) {
            <a
              [routerLink]="['/rentals', item.id]"
              class="group overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                [src]="item.imageUrl || placeholder"
                [alt]="item.title"
                class="h-44 w-full object-cover transition group-hover:scale-[1.02]"
              />
              <div class="p-4">
                <h2 class="font-display text-lg font-semibold text-teal-900">{{ item.title }}</h2>
                <p class="mt-1 text-sm text-[var(--color-muted)]">
                  {{ item.shopName || 'Shop' }}{{ item.city ? ' · ' + item.city : '' }}
                </p>
                @if (item.price != null) {
                  <p class="mt-3 text-base font-bold text-teal-800">
                    {{ priceLabel(item.price, item.priceUnit) }}
                  </p>
                }
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class RentalsComponent implements OnInit {
  private readonly api = inject(RentalsService);

  items: RentalListing[] = [];
  loading = true;
  search = '';
  readonly placeholder = PLACEHOLDER;

  ngOnInit(): void {
    this.apply();
  }

  apply(): void {
    this.loading = true;
    this.api.getRentals({ search: this.search || undefined }).subscribe((items) => {
      this.items = items;
      this.loading = false;
    });
  }

  priceLabel(price: number, unit: string): string {
    const amount = formatLkr(price);
    if (unit === 'FROM') return `From ${amount}`;
    if (unit === 'HOURLY' || unit === 'PER_HOUR') return `${amount}/hr`;
    if (unit === 'PER_DAY') return `${amount}/day`;
    return amount;
  }
}
