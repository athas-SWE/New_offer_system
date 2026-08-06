import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ShopServicesService } from '../../services/shop-services.service';
import { SeoService } from '../../services/seo.service';
import { ServiceListing } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { formatLkr } from '../../shared/utils';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, MatIconModule],
  template: `
    <div class="page-shell animate-fade-in">
      @if (loading) {
        <app-loading-spinner />
      } @else if (!item) {
        <div class="surface-panel text-center">
          <p class="font-display text-2xl text-teal-900">Service not found</p>
          <a routerLink="/services" class="btn-primary mt-4">Back to services</a>
        </div>
      } @else {
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="overflow-hidden rounded-3xl">
            <img
              [src]="item.imageUrl || placeholder"
              [alt]="item.title"
              class="h-full min-h-[320px] w-full object-cover"
            />
          </div>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-600">Service</p>
            <h1 class="mt-2 font-display text-2xl font-semibold text-teal-900 sm:text-3xl md:text-4xl">
              {{ item.title }}
            </h1>
            @if (item.description) {
              <p class="mt-4 text-[var(--color-muted)]">{{ item.description }}</p>
            }
            @if (item.price != null) {
              <p class="mt-6 text-3xl font-bold text-teal-800">
                {{ priceLabel(item.price, item.priceUnit) }}
              </p>
            }
            <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              @if (item.shopName) {
                <div class="surface-panel !p-3">
                  <dt class="text-[var(--color-muted)]">Shop</dt>
                  <dd class="mt-1 font-semibold text-teal-900">
                    <a [routerLink]="['/shops', item.shopId]" class="hover:underline">{{ item.shopName }}</a>
                  </dd>
                </div>
              }
              @if (item.city) {
                <div class="surface-panel !p-3">
                  <dt class="text-[var(--color-muted)]">City</dt>
                  <dd class="mt-1 font-semibold text-teal-900">{{ item.city }}</dd>
                </div>
              }
            </dl>
            <div class="mt-8 flex flex-wrap gap-3">
              @if (item.shopId) {
                <a [routerLink]="['/shops', item.shopId]" class="btn-primary">
                  <mat-icon class="!text-base">store</mat-icon>
                  View shop
                </a>
              }
              <a routerLink="/services" class="btn-secondary">Browse more</a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ServiceDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ShopServicesService);
  private readonly seo = inject(SeoService);

  item?: ServiceListing;
  loading = true;
  readonly placeholder = PLACEHOLDER;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.api.getServiceById(id).subscribe((item) => {
      this.item = item;
      this.loading = false;
      this.seo.update({
        title: item ? item.title : 'Service not found',
        description: item?.description || 'Service details on Offer Lanka.',
        path: `/services/${id}`,
        image: item?.imageUrl,
        noIndex: !item,
      });
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
