import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StoresService } from '../../services/stores.service';
import { PageMeta, Store } from '../../models';
import { emptyPageMeta } from '../../models/pagination.model';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatIconModule,
    LoadingSpinnerComponent,
    PaginationComponent,
  ],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Shops</h1>
      <p class="section-sub">Partner shops listing offers on Offer Lanka.</p>

      <div class="mt-6 max-w-md">
        <input
          class="input-field"
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange()"
          placeholder="Search shops or cities…"
        />
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else if (!stores.length) {
        <div class="surface-panel mt-10 text-center">
          <p class="font-display text-xl text-teal-900">No shops found</p>
        </div>
      } @else {
        <p class="mt-6 text-sm text-[var(--color-muted)]">{{ pageMeta.total }} shops found</p>
        <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (store of stores; track store.id) {
            <a [routerLink]="['/shops', store.id]" class="offer-card-lift surface-panel !p-0 overflow-hidden">
              <div class="flex items-center gap-4 p-4">
                <img [src]="store.logoUrl" [alt]="store.name" class="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                <div class="min-w-0 flex-1">
                  <div class="flex min-w-0 items-start gap-2">
                    <h2 class="min-w-0 truncate font-display text-lg font-semibold text-teal-900">{{ store.name }}</h2>
                    @if (store.isVerified) {
                      <mat-icon class="!text-base shrink-0 text-teal-600">verified</mat-icon>
                    }
                  </div>
                  <p class="text-sm text-[var(--color-muted)]">{{ store.city }}</p>
                  @if (store.ownerName) {
                    <p class="text-xs text-teal-700">Owner: {{ store.ownerName }}</p>
                  }
                  <p class="mt-1 text-xs font-semibold text-gold-600">
                    @if (store.rating) {
                      ★ {{ store.rating }} ·
                    }
                    {{ store.offerCount || 0 }} offers
                  </p>
                </div>
              </div>
              <p class="border-t border-teal-50 px-4 py-3 text-sm text-[var(--color-muted)] line-clamp-2">{{ store.description }}</p>
            </a>
          }
        </div>
        <app-pagination [meta]="pageMeta" [disabled]="loading" (pageChange)="goToPage($event)" />
      }
    </div>
  `,
})
export class StoresComponent implements OnInit {
  private readonly storesService = inject(StoresService);
  stores: Store[] = [];
  search = '';
  loading = true;
  pageMeta: PageMeta = emptyPageMeta(1, 12);
  private readonly pageSize = 12;

  ngOnInit(): void {
    this.load();
  }

  onSearchChange(): void {
    this.pageMeta = { ...this.pageMeta, page: 1 };
    this.load();
  }

  goToPage(page: number): void {
    this.pageMeta = { ...this.pageMeta, page };
    this.load();
  }

  load(): void {
    this.loading = true;
    this.storesService
      .getStoresPage(this.search, this.pageMeta.page, this.pageSize)
      .subscribe((res) => {
        this.stores = res.items;
        this.pageMeta = res.meta;
        this.loading = false;
      });
  }
}
