import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OffersService } from '../../services/offers.service';
import { StoresService } from '../../services/stores.service';
import { Offer, PageMeta, Store } from '../../models';
import { emptyPageMeta } from '../../models/pagination.model';
import { OfferCardComponent } from '../../components/offer-card/offer-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatIconModule,
    OfferCardComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Search</h1>
      <p class="section-sub">Find offers and shops across Sri Lanka.</p>

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
          <h2 class="font-display text-2xl font-semibold text-teal-900">
            Offers ({{ offersMeta.total }})
          </h2>
          @if (!offers.length) {
            <p class="mt-3 text-sm text-[var(--color-muted)]">No matching offers.</p>
          } @else {
            <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              @for (offer of offers; track offer.id) {
                <app-offer-card [offer]="offer" />
              }
            </div>
            <app-pagination
              [meta]="offersMeta"
              [disabled]="loading"
              (pageChange)="onOffersPage($event)"
            />
          }
        </div>

        <div class="mt-12">
          <h2 class="font-display text-2xl font-semibold text-teal-900">
            Shops ({{ storesMeta.total }})
          </h2>
          @if (!stores.length) {
            <p class="mt-3 text-sm text-[var(--color-muted)]">No matching shops.</p>
          } @else {
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              @for (store of stores; track store.id) {
                <a
                  [routerLink]="['/shops', store.id]"
                  class="surface-panel flex items-center gap-3 transition hover:shadow-lift"
                >
                  <img [src]="store.logoUrl" [alt]="store.name" class="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <p class="font-semibold text-teal-900">{{ store.name }}</p>
                    <p class="text-sm text-[var(--color-muted)]">{{ store.city }}</p>
                  </div>
                </a>
              }
            </div>
            <app-pagination
              [meta]="storesMeta"
              [disabled]="loading"
              (pageChange)="onStoresPage($event)"
            />
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
  offersMeta: PageMeta = emptyPageMeta(1, 12);
  storesMeta: PageMeta = emptyPageMeta(1, 12);
  loading = false;
  searched = false;
  nearbyNote = '';
  private readonly pageSize = 12;

  ngOnInit(): void {
    // Ready for deep-links / query params later
  }

  runSearch(): void {
    this.offersMeta = emptyPageMeta(1, this.pageSize);
    this.storesMeta = emptyPageMeta(1, this.pageSize);
    this.nearbyNote = '';
    this.loadResults();
  }

  onOffersPage(page: number): void {
    this.offersMeta = { ...this.offersMeta, page };
    this.loadOffersOnly();
  }

  onStoresPage(page: number): void {
    this.storesMeta = { ...this.storesMeta, page };
    this.loadStoresOnly();
  }

  searchNearby(): void {
    this.loading = true;
    this.searched = true;
    this.offersMeta = emptyPageMeta(1, this.pageSize);
    this.storesMeta = emptyPageMeta(1, this.pageSize);
    const fallback = () => {
      this.nearbyNote = 'Showing nearby offers around Colombo (6.9271, 79.8612).';
      this.offersService.getNearby(6.9271, 79.8612).subscribe((offers) => {
        this.offers = offers.slice(0, this.pageSize);
        this.offersMeta = {
          total: offers.length,
          page: 1,
          limit: this.pageSize,
          totalPages: Math.ceil(offers.length / this.pageSize) || 0,
        };
        this.loading = false;
      });
      this.loadStoresOnly('Colombo');
    };

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.nearbyNote = `Showing nearby offers near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}.`;
        this.offersService
          .getNearby(pos.coords.latitude, pos.coords.longitude)
          .subscribe((offers) => {
            this.offers = offers.slice(0, this.pageSize);
            this.offersMeta = {
              total: offers.length,
              page: 1,
              limit: this.pageSize,
              totalPages: Math.ceil(offers.length / this.pageSize) || 0,
            };
            this.loading = false;
          });
        this.loadStoresOnly();
      },
      () => fallback(),
    );
  }

  private loadResults(): void {
    this.loading = true;
    this.searched = true;
    const q = this.query.trim();
    this.offersService
      .getOffersPage({ search: q, page: this.offersMeta.page, limit: this.pageSize })
      .subscribe((res) => {
        this.offers = res.items;
        this.offersMeta = res.meta;
        this.loading = false;
      });
    this.loadStoresOnly(q);
  }

  private loadOffersOnly(): void {
    this.loading = true;
    this.offersService
      .getOffersPage({
        search: this.query.trim(),
        page: this.offersMeta.page,
        limit: this.pageSize,
      })
      .subscribe((res) => {
        this.offers = res.items;
        this.offersMeta = res.meta;
        this.loading = false;
      });
  }

  private loadStoresOnly(search = this.query.trim()): void {
    this.storesService
      .getStoresPage(search, this.storesMeta.page, this.pageSize)
      .subscribe((res) => {
        this.stores = res.items;
        this.storesMeta = res.meta;
      });
  }
}
