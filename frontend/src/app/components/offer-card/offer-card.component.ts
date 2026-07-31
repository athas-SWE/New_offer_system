import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Offer } from '../../models';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { formatLkr } from '../../shared/utils';

@Component({
  selector: 'app-offer-card',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <article class="offer-card-lift surface-panel overflow-hidden !p-0">
      <a [routerLink]="['/offers', offer.id]" class="block">
        <div class="relative h-44 overflow-hidden">
          <img [src]="offer.imageUrl" [alt]="offer.title" class="h-full w-full object-cover" />
          <span class="absolute left-3 top-3 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-bold text-teal-900">
            -{{ offer.discountPercent }}%
          </span>
          @if (offer.distanceKm != null) {
            <span class="absolute bottom-3 left-3 rounded-full bg-teal-900/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {{ offer.distanceKm.toFixed(1) }} km
            </span>
          }
        </div>
        <div class="p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-teal-600">{{ offer.storeName }} · {{ offer.city }}</p>
          <h3 class="mt-1 font-display text-lg font-semibold text-teal-900">{{ offer.title }}</h3>
          <p class="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">{{ offer.description }}</p>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-lg font-bold text-teal-800">{{ formatPrice(offer.offerPrice) }}</span>
            <span class="text-sm text-[var(--color-muted)] line-through">{{ formatPrice(offer.originalPrice) }}</span>
          </div>
        </div>
      </a>
      <div class="flex items-center justify-between border-t border-teal-50 px-4 py-2">
        <span class="chip">{{ offer.categoryName || 'Offer' }}</span>
        <button
          type="button"
          class="rounded-full p-2 text-teal-700 transition hover:bg-teal-50"
          (click)="onFavorite($event)"
          [attr.aria-label]="favorited ? 'Remove favourite' : 'Save favourite'"
        >
          <mat-icon>{{ favorited ? 'favorite' : 'favorite_border' }}</mat-icon>
        </button>
      </div>
    </article>
  `,
})
export class OfferCardComponent {
  @Input({ required: true }) offer!: Offer;
  @Output() favoriteToggled = new EventEmitter<boolean>();

  private readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);

  get favorited(): boolean {
    return this.favorites.isFavorite(this.offer.id);
  }

  formatPrice(amount: number): string {
    return formatLkr(amount);
  }

  onFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isAuthenticated) {
      return;
    }
    this.favorites.toggle(this.offer).subscribe((state) => this.favoriteToggled.emit(state));
  }
}
