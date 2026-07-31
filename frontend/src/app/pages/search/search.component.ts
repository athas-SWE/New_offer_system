import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OffersService } from '../../services/offers.service';
import { StoresService } from '../../services/stores.service';
import { Offer, Store } from '../../models';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, OfferCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Search</h1>
      <p class="section-sub">Find offers and stores across Sri Lanka.</p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-600">search</mat-icon>
          <input
            class="input-field !pl-11"
            [(ngModel)]="query"
            (keyup.enter)="runSearch()"
            placeholder="Try “seafood Colombo” or “spa Kandy”…"
          />
        </div>
        <button type="button" class="btn-primary" (click)="runSearch()">Search</button>
        <button type="button" class="btn-secondary" (click)="searchNearby()">
          <mat-icon>near_me</mat-icon>
          Nearby
        </button>
      </div>

      @if (nearbyNote) {
        <p class="mt-3 text-sm text-teal-700">{{ nearbyNote }}</p>
      }

      @if (loading) {
        <app-loading-spinner label="Searching…" />
      } @else if (searched) {
        <div class="mt-10">
          <h2 class="font-display text-2xl font-semibold text-teal-900">Offers ({{ offers.length }})</h2>
          @if (!offers.length) {
            <p class="mt-3 text-sm text-[var(--color-muted)]">No matching offers.</p>
          } @else {
            <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              @for (offer of offers; track offer.id) {
                <app-offer-card [offer]="offer" />
              }
            </div>
          }
        </div>

        <div class="mt-12">
          <h2 class="font-display text-2xl font-semibold text-teal-900">Stores ({{ stores.length }})</h2>
          @if (!stores.length) {
            <p class="mt-3 text-sm text-[var(--color-muted)]">No matching stores.</p>
          } @else {
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (store of stores; track store.id) {
                <a [routerLink]="['/stores', store.id]" class="surface-panel flex items-center gap-3 transition hover:shadow-lift">
                  <img [src]="store.logoUrl" [alt]="store.name" class="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <p class="font-semibold text-teal-900">{{ store.name }}</p>
                    <p class="text-sm text-[var(--color-muted)]">{{ store.city }}</p>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private readonly offersService = inject(OffersService);
  private readonly storesService = inject(StoresService);

  query = '';
  offers: Offer[] = [];
  stores: Store[] = [];
  loading = false;
  searched = false;
  nearbyNote = '';

  ngOnInit(): void {
    // Ready for deep-links / query params later
  }

  runSearch(): void {
    this.loading = true;
    this.searched = true;
    this.nearbyNote = '';
    const q = this.query.trim();
    this.offersService.getOffers({ search: q }).subscribe((offers) => {
      this.offers = offers;
      this.loading = false;
    });
    this.storesService.getStores(q).subscribe((stores) => (this.stores = stores));
  }

  searchNearby(): void {
    this.loading = true;
    this.searched = true;
    const fallback = () => {
      this.nearbyNote = 'Showing nearby offers around Colombo (6.9271, 79.8612).';
      this.offersService.getNearby(6.9271, 79.8612).subscribe((offers) => {
        this.offers = offers;
        this.loading = false;
      });
      this.storesService.getStores('Colombo').subscribe((stores) => (this.stores = stores));
    };

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.nearbyNote = `Showing nearby offers near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}.`;
        this.offersService.getNearby(pos.coords.latitude, pos.coords.longitude).subscribe((offers) => {
          this.offers = offers;
          this.loading = false;
        });
        this.storesService.getStores().subscribe((stores) => (this.stores = stores));
      },
      () => fallback()
    );
  }
}
