import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StoresService } from '../../services/stores.service';
import { OffersService } from '../../services/offers.service';
import { Offer, Store } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

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
            <p class="font-display text-2xl text-teal-900">Store not found</p>
            <a routerLink="/stores" class="btn-primary mt-4">Back to stores</a>
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
            <div class="flex items-end gap-4">
              <img [src]="store.logoUrl" [alt]="store.name" class="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg" />
              <div class="text-white">
                <div class="flex items-center gap-2">
                  <h1 class="font-display text-3xl font-semibold sm:text-4xl">{{ store.name }}</h1>
                  @if (store.isVerified) {
                    <mat-icon class="text-gold-400">verified</mat-icon>
                  }
                </div>
                <p class="mt-1 text-teal-100">{{ store.city }} · ★ {{ store.rating }}</p>
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
                  <dd class="font-medium text-teal-900">{{ store.address }}</dd>
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
                    <dd>
                      <a [href]="store.website" target="_blank" rel="noopener" class="font-medium text-teal-700 underline">Visit site</a>
                    </dd>
                  </div>
                }
              </dl>
            </div>
            <div class="lg:col-span-2">
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

  store?: Store;
  storeOffers: Offer[] = [];
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.storesService.getStoreById(id).subscribe((store) => {
      this.store = store;
      this.loading = false;
      if (store) {
        this.offersService.getOffers({ storeId: store.id }).subscribe((offers) => (this.storeOffers = offers));
      }
    });
  }
}
