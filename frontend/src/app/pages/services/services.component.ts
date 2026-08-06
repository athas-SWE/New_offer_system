import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShopServicesService } from '../../services/shop-services.service';
import { PageMeta, ServiceListing } from '../../models';
import { emptyPageMeta } from '../../models/pagination.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { formatLkr } from '../../shared/utils';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent, PaginationComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Services</h1>
      <p class="section-sub">Browse services offered by local shops across Sri Lanka.</p>

      <div class="mt-8">
        <input
          class="input-field max-w-xl"
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange()"
          placeholder="Search services…"
        />
      </div>

      @if (loading) {
        <app-loading-spinner label="Loading services…" />
      } @else if (!items.length) {
        <div class="surface-panel mt-10 text-center">
          <p class="font-display text-xl text-teal-900">No services found</p>
          <p class="mt-2 text-sm text-[var(--color-muted)]">Check back soon or browse shops.</p>
          <a routerLink="/shops" class="btn-primary mt-4">Browse shops</a>
        </div>
      } @else {
        <p class="mt-6 text-sm text-[var(--color-muted)]">{{ pageMeta.total }} services found</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (item of items; track item.id) {
            <a
              [routerLink]="['/services', item.id]"
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
        <app-pagination [meta]="pageMeta" [disabled]="loading" (pageChange)="goToPage($event)" />
      }
    </div>
  `,
})
export class ServicesComponent implements OnInit {
  private readonly api = inject(ShopServicesService);

  items: ServiceListing[] = [];
  loading = true;
  search = '';
  pageMeta: PageMeta = emptyPageMeta(1, 12);
  readonly placeholder = PLACEHOLDER;
  private readonly pageSize = 12;

  ngOnInit(): void {
    this.apply();
  }

  onSearchChange(): void {
    this.pageMeta = { ...this.pageMeta, page: 1 };
    this.apply();
  }

  goToPage(page: number): void {
    this.pageMeta = { ...this.pageMeta, page };
    this.apply();
  }

  apply(): void {
    this.loading = true;
    this.api
      .getServicesPage({
        search: this.search || undefined,
        page: this.pageMeta.page,
        limit: this.pageSize,
      })
      .subscribe((res) => {
        this.items = res.items;
        this.pageMeta = res.meta;
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
