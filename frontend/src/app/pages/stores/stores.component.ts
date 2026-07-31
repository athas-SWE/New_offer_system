import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StoresService } from '../../services/stores.service';
import { Store } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [RouterLink, FormsModule, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      <h1 class="section-title">Shops</h1>
      <p class="section-sub">Partner shops listing offers on Offer Lanka.</p>

      <div class="mt-6 max-w-md">
        <input class="input-field" [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search shops or cities…" />
      </div>

      @if (loading) {
        <app-loading-spinner />
      } @else {
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (store of stores; track store.id) {
            <a [routerLink]="['/shops', store.id]" class="offer-card-lift surface-panel !p-0 overflow-hidden">
              <div class="flex items-center gap-4 p-4">
                <img [src]="store.logoUrl" [alt]="store.name" class="h-16 w-16 rounded-2xl object-cover" />
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-display text-lg font-semibold text-teal-900">{{ store.name }}</h2>
                    @if (store.isVerified) {
                      <mat-icon class="!text-base text-teal-600">verified</mat-icon>
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
      }
    </div>
  `,
})
export class StoresComponent implements OnInit {
  private readonly storesService = inject(StoresService);
  stores: Store[] = [];
  search = '';
  loading = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.storesService.getStores(this.search).subscribe((stores) => {
      this.stores = stores;
      this.loading = false;
    });
  }
}
