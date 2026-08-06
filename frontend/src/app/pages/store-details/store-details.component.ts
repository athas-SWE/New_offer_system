import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { StoresService } from '../../services/stores.service';
import { OffersService } from '../../services/offers.service';
import { ShopServicesService } from '../../services/shop-services.service';
import { RentalsService } from '../../services/rentals.service';
import { SeoService } from '../../services/seo.service';
import { Offer, RentalListing, ServiceListing, Store } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { formatLkr, displayUrl } from '../../shared/utils';

const SERVICE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80';
const RENTAL_PLACEHOLDER =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80';

@Component({
  selector: 'app-store-details',
  standalone: true,
  imports: [RouterLink, MatIconModule, OfferCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="animate-fade-in">
      @if (loading) {
        <div class="page-shell"><app-loading-spinner /></div>
      } @else if (!store) {
        <div class="page-shell">
          <div class="surface-panel text-center">
            <p class="font-display text-2xl text-teal-900">Shop not found</p>
            <a routerLink="/shops" class="btn-primary mt-4">Back to shops</a>
          </div>
        </div>
      } @else {
        <section class="relative h-56 overflow-hidden sm:h-72">
          <img
            [src]="store.coverUrl || store.logoUrl"
            [alt]="store.name"
            class="h-full w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-teal-950/80 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
            <div class="flex items-end gap-3 sm:gap-4">
              <img
                [src]="store.logoUrl"
                [alt]="store.name"
                class="h-16 w-16 shrink-0 rounded-2xl border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
              />
              <div class="min-w-0 flex-1 text-white">
                <div class="flex min-w-0 items-start gap-2">
                  <h1 class="min-w-0 break-words font-display text-2xl font-semibold sm:text-3xl md:text-4xl">
                    {{ store.name }}
                  </h1>
                  @if (store.isVerified) {
                    <mat-icon class="mt-1 shrink-0 text-gold-400">verified</mat-icon>
                  }
                </div>
                <p class="mt-1 text-sm text-teal-100 sm:text-base">{{ store.city }} · ★ {{ store.rating }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="page-shell">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="surface-panel lg:col-span-1">
              <h2 class="font-display text-xl font-semibold text-teal-900">About</h2>
              <p class="mt-3 text-sm text-[var(--color-muted)]">{{ store.description }}</p>
              <dl class="mt-5 space-y-3 text-sm">
                <div>
                  <dt class="text-[var(--color-muted)]">Address</dt>
                  <dd class="font-medium text-teal-900">{{ store.address || 'Not provided' }}</dd>
                </div>
                @if (store.phone) {
                  <div>
                    <dt class="text-[var(--color-muted)]">Phone</dt>
                    <dd class="font-medium text-teal-900">{{ store.phone }}</dd>
                  </div>
                }
                @if (store.website) {
                  <div>
                    <dt class="text-[var(--color-muted)]">Website</dt>
                    <dd class="min-w-0">
                      <a
                        [href]="store.website"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex min-w-0 items-center gap-1.5 break-all font-medium text-teal-700 underline"
                        [title]="store.website"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base" svgIcon="website"></mat-icon>
                        {{ websiteLabel }}
                      </a>
                    </dd>
                  </div>
                }
              </dl>

              @if (store.instagramUrl || store.facebookUrl || store.website) {
                <div class="mt-5">
                  <h3 class="text-sm font-semibold text-teal-900">Follow</h3>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @if (store.instagramUrl) {
                      <a
                        [href]="store.instagramUrl"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                        [title]="store.instagramUrl"
                        aria-label="Instagram"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base" svgIcon="instagram"></mat-icon>
                        <span class="truncate">Instagram</span>
                      </a>
                    }
                    @if (store.facebookUrl) {
                      <a
                        [href]="store.facebookUrl"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                        [title]="store.facebookUrl"
                        aria-label="Facebook"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base" svgIcon="facebook"></mat-icon>
                        <span class="truncate">Facebook</span>
                      </a>
                    }
                    @if (store.website) {
                      <a
                        [href]="store.website"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
                        [title]="store.website"
                        aria-label="Website"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base" svgIcon="website"></mat-icon>
                        <span class="truncate">Website</span>
                      </a>
                    }
                  </div>
                </div>
              }

              @if (mapEmbedUrl || mapsLink) {
                <div class="mt-6">
                  <h3 class="font-display text-lg font-semibold text-teal-900">Location</h3>
                  @if (mapEmbedUrl) {
                    <div class="mt-3 overflow-hidden rounded-xl border border-teal-100">
                      <iframe
                        title="Shop location map"
                        class="h-56 w-full"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        [src]="mapEmbedUrl"
                      ></iframe>
                    </div>
                  }
                  @if (mapsLink) {
                    <a
                      [href]="mapsLink"
                      target="_blank"
                      rel="noopener"
                      class="btn-secondary mt-3 !justify-start"
                    >
                      <mat-icon class="!text-base">map</mat-icon>
                      Open in Google Maps
                    </a>
                  }
                </div>
              }
            </div>
            <div class="space-y-10 lg:col-span-2">
              <div>
                <h2 class="section-title !text-2xl">Current offers</h2>
                @if (!storeOffers.length) {
                  <p class="mt-4 text-sm text-[var(--color-muted)]">No active offers right now.</p>
                } @else {
                  <div class="mt-4 grid gap-5 sm:grid-cols-2">
                    @for (offer of storeOffers; track offer.id) {
                      <app-offer-card [offer]="offer" />
                    }
                  </div>
                }
              </div>

              <div>
                <h2 class="section-title !text-2xl">Services</h2>
                @if (!storeServices.length) {
                  <p class="mt-4 text-sm text-[var(--color-muted)]">No services listed yet.</p>
                } @else {
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    @for (svc of storeServices; track svc.id) {
                      <a
                        [routerLink]="['/services', svc.id]"
                        class="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <img
                          [src]="svc.imageUrl || servicePlaceholder"
                          [alt]="svc.title"
                          class="h-32 w-full object-cover"
                        />
                        <div class="p-3">
                          <p class="font-semibold text-teal-900">{{ svc.title }}</p>
                          @if (svc.price != null) {
                            <p class="mt-1 text-sm font-bold text-teal-800">
                              {{ priceLabel(svc.price, svc.priceUnit) }}
                            </p>
                          }
                        </div>
                      </a>
                    }
                  </div>
                }
              </div>

              <div>
                <h2 class="section-title !text-2xl">Rentals</h2>
                @if (!storeRentals.length) {
                  <p class="mt-4 text-sm text-[var(--color-muted)]">No rentals listed yet.</p>
                } @else {
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    @for (rental of storeRentals; track rental.id) {
                      <a
                        [routerLink]="['/rentals', rental.id]"
                        class="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <img
                          [src]="rental.imageUrl || rentalPlaceholder"
                          [alt]="rental.title"
                          class="h-32 w-full object-cover"
                        />
                        <div class="p-3">
                          <p class="font-semibold text-teal-900">{{ rental.title }}</p>
                          @if (rental.price != null) {
                            <p class="mt-1 text-sm font-bold text-teal-800">
                              {{ priceLabel(rental.price, rental.priceUnit) }}
                            </p>
                          }
                        </div>
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StoreDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storesService = inject(StoresService);
  private readonly offersService = inject(OffersService);
  private readonly shopServicesApi = inject(ShopServicesService);
  private readonly rentalsApi = inject(RentalsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(SeoService);

  store?: Store;
  storeOffers: Offer[] = [];
  storeServices: ServiceListing[] = [];
  storeRentals: RentalListing[] = [];
  loading = true;
  mapEmbedUrl?: SafeResourceUrl;
  mapsLink?: string;
  readonly servicePlaceholder = SERVICE_PLACEHOLDER;
  readonly rentalPlaceholder = RENTAL_PLACEHOLDER;

  get websiteLabel(): string {
    return displayUrl(this.store?.website) || 'Visit site';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.storesService.getStoreById(id).subscribe((store) => {
      this.store = store;
      this.loading = false;
      this.setupMap(store);
      this.applySeo(store, id);
      if (store) {
        this.offersService.getOffers({ storeId: store.id }).subscribe((offers) => (this.storeOffers = offers));
        this.shopServicesApi
          .getServices({ shopId: store.id })
          .subscribe((items) => (this.storeServices = items));
        this.rentalsApi
          .getRentals({ shopId: store.id })
          .subscribe((items) => (this.storeRentals = items));
      }
    });
  }

  priceLabel(price: number, unit: string): string {
    const amount = formatLkr(price);
    if (unit === 'FROM') return `From ${amount}`;
    if (unit === 'HOURLY' || unit === 'PER_HOUR') return `${amount}/hr`;
    if (unit === 'PER_DAY') return `${amount}/day`;
    return amount;
  }

  private applySeo(store: Store | undefined, id: string): void {
    if (!store) {
      this.seo.update({
        title: 'Shop not found',
        description: 'This shop could not be found on Offer Lanka.',
        path: `/shops/${id}`,
        noIndex: true,
      });
      return;
    }

    this.seo.update({
      title: `${store.name}${store.city ? ` — ${store.city}` : ''}`,
      description:
        store.description ||
        `View deals and offers from ${store.name}${store.city ? ` in ${store.city}` : ''} on Offer Lanka.`,
      image: store.coverUrl || store.logoUrl,
      path: `/shops/${store.id}`,
      keywords: [store.name, store.city, 'shop', 'deals', 'Offer Lanka'].filter(Boolean).join(', '),
      jsonLd: this.seo.storeJsonLd(store),
    });
  }

  private setupMap(store?: Store): void {
    this.mapEmbedUrl = undefined;
    this.mapsLink = undefined;
    if (!store) return;

    const lat = store.latitude;
    const lng = store.longitude;
    const hasCoords =
      lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    if (hasCoords) {
      const delta = 0.01;
      const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
      const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
      this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    }

    if (store.locationUrl) {
      this.mapsLink = store.locationUrl;
    } else if (hasCoords) {
      this.mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    }
  }
}
