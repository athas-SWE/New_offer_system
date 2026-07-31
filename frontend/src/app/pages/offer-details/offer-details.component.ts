import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OffersService } from '../../services/offers.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { Offer } from '../../models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { formatDate, formatLkr } from '../../shared/utils';

@Component({
  selector: 'app-offer-details',
  standalone: true,
  imports: [RouterLink, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="page-shell animate-fade-in">
      @if (loading) {
        <app-loading-spinner />
      } @else if (!offer) {
        <div class="surface-panel text-center">
          <p class="font-display text-2xl text-teal-900">Offer not found</p>
          <a routerLink="/offers" class="btn-primary mt-4">Back to offers</a>
        </div>
      } @else {
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="overflow-hidden rounded-3xl">
            <img [src]="offer.imageUrl" [alt]="offer.title" class="h-full min-h-[320px] w-full object-cover" />
          </div>
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-teal-600">
              {{ offer.categoryName }} · {{ offer.city }}
            </p>
            <h1 class="mt-2 font-display text-4xl font-semibold text-teal-900">{{ offer.title }}</h1>
            <p class="mt-4 text-[var(--color-muted)]">{{ offer.description }}</p>

            <div class="mt-6 flex flex-wrap items-end gap-3">
              <span class="text-3xl font-bold text-teal-800">{{ price(offer.offerPrice) }}</span>
              <span class="text-lg text-[var(--color-muted)] line-through">{{ price(offer.originalPrice) }}</span>
              <span class="rounded-full bg-gold-500 px-3 py-1 text-sm font-bold text-teal-900">-{{ offer.discountPercent }}%</span>
            </div>

            <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div class="surface-panel !p-3">
                <dt class="text-[var(--color-muted)]">Store</dt>
                <dd class="mt-1 font-semibold text-teal-900">
                  <a [routerLink]="['/stores', offer.storeId]" class="hover:underline">{{ offer.storeName }}</a>
                </dd>
              </div>
              <div class="surface-panel !p-3">
                <dt class="text-[var(--color-muted)]">Valid until</dt>
                <dd class="mt-1 font-semibold text-teal-900">{{ date(offer.endsAt) }}</dd>
              </div>
            </dl>

            @if (offer.tags?.length) {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (tag of offer.tags; track tag) {
                  <span class="chip">{{ tag }}</span>
                }
              </div>
            }

            <div class="mt-8 flex flex-wrap gap-3">
              <button type="button" class="btn-primary" (click)="toggleFavorite()">
                <mat-icon>{{ favorited ? 'favorite' : 'favorite_border' }}</mat-icon>
                {{ favorited ? 'Saved' : 'Save favourite' }}
              </button>
              <a [routerLink]="['/stores', offer.storeId]" class="btn-secondary">View store</a>
            </div>
            @if (!auth.isAuthenticated) {
              <p class="mt-3 text-sm text-[var(--color-muted)]">
                <a routerLink="/login" class="font-semibold text-teal-700 underline">Log in</a> to save favourites.
              </p>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class OfferDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly offersService = inject(OffersService);
  private readonly favorites = inject(FavoritesService);
  readonly auth = inject(AuthService);

  offer?: Offer;
  loading = true;

  get favorited(): boolean {
    return !!this.offer && this.favorites.isFavorite(this.offer.id);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.offersService.getOfferById(id).subscribe((offer) => {
      this.offer = offer;
      this.loading = false;
    });
  }

  price(amount: number): string {
    return formatLkr(amount);
  }

  date(value: string): string {
    return formatDate(value);
  }

  toggleFavorite(): void {
    if (!this.offer || !this.auth.isAuthenticated) {
      return;
    }
    this.favorites.toggle(this.offer).subscribe();
  }
}
